<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('pages', function (Blueprint $table) {
            $table->uuid('branch_id')->nullable()->after('site_id');
            $table->uuid('logical_id')->nullable()->after('id'); // ID that stays consistent across branches
            
            // We can't immediately add foreign key constraint if existing rows have null
            // For now, let's make it nullable and we will backfill later.
            // Ideally should be non-nullable for future rows.
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pages', function (Blueprint $table) {
            $table->dropColumn(['branch_id', 'logical_id']);
        });
    }
};
