<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\Site;
use App\Models\Page;
use App\Models\Branch;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Backfill existing sites with a 'main' branch
        $sites = Site::all();
        foreach ($sites as $site) {
            $mainBranch = Branch::firstOrCreate(
                ['site_id' => $site->id, 'name' => 'main'],
                [
                    'created_by' => $site->user_id,
                    'is_default' => true
                ]
            );

            // Update all pages of this site to belong to main branch
            // and set logical_id = id (idempotent if already set)
            Page::where('site_id', $site->id)
                ->whereNull('branch_id')
                ->chunk(100, function ($pages) use ($mainBranch) {
                    foreach ($pages as $page) {
                        $page->update([
                            'branch_id' => $mainBranch->id,
                            'logical_id' => $page->id
                        ]);
                    }
                });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No strict reverse needed as this is data fix
    }
};
