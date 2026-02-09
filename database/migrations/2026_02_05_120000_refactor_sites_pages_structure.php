<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Add site_id to pages table (idempotent check)
        if (!Schema::hasColumn('pages', 'site_id')) {
            Schema::table('pages', function (Blueprint $table) {
                $table->foreignUuid('site_id')->nullable()->after('id')->constrained('sites')->onDelete('cascade');
            });
        }

        // 2. Drop constraints
        Schema::table('pages', function (Blueprint $table) {
            // Check & Drop index unique
            try {
                $table->dropUnique(['space_id', 'slug']);
            } catch (\Exception $e) {
            }

            // Check & Drop foreign key
            if (Schema::hasColumn('pages', 'space_id')) {
                try {
                    $table->dropForeign(['space_id']); // pages_space_id_foreign
                } catch (\Exception $e) {
                }

                $table->dropColumn('space_id');
            }
        });

        // 3. Drop spaces tables
        Schema::dropIfExists('site_spaces');
        Schema::dropIfExists('space_members');
        Schema::dropIfExists('spaces');
    }

    public function down(): void {}
};
