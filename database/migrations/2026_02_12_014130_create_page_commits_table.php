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
        Schema::create('page_commits', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('page_id')->constrained('pages')->cascadeOnDelete();
            $table->foreignUuid('page_change_request_id')->nullable()->constrained('page_change_requests')->nullOnDelete();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            
            $table->string('title')->nullable();
            $table->json('content');
            $table->string('message')->nullable(); // Commit message
            
            $table->timestamps();
            
            $table->index('page_id');
            $table->index('page_change_request_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('page_commits');
    }
};
