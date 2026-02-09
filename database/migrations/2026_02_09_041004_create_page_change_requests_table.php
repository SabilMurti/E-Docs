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
        Schema::create('page_change_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('page_id')->constrained('pages')->cascadeOnDelete();
            $table->foreignUuid('user_id')->nullable()->constrained('users')->nullOnDelete();
            
            // Proposed Revisions (Null = no change)
            $table->string('title')->nullable(); 
            $table->json('content')->nullable();
            
            // Workflow: draft -> open (review) -> merged | rejected
            $table->string('status')->default('draft'); 
            $table->text('description')->nullable(); // Commit message / PR description
            
            $table->timestamps();
            
            // Indexes for faster lookups
            $table->index(['page_id', 'status']);
            $table->index('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('page_change_requests');
    }
};
