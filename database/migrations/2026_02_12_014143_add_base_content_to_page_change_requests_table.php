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
        Schema::table('page_change_requests', function (Blueprint $table) {
            $table->string('base_title')->nullable()->after('user_id');
            $table->json('base_content')->nullable()->after('base_title');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('page_change_requests', function (Blueprint $table) {
            $table->dropColumn(['base_title', 'base_content']);
        });
    }
};
