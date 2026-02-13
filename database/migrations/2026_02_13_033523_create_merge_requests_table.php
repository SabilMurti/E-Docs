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
        Schema::create('merge_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('site_id')->constrained('sites')->cascadeOnDelete();
            
            $table->foreignUuid('source_branch_id')->constrained('branches')->cascadeOnDelete();
            $table->foreignUuid('target_branch_id')->constrained('branches')->cascadeOnDelete();
            
            $table->string('title');
            $table->text('description')->nullable();
            
            $table->string('status')->default('open'); // open, closed, merged
            
            $table->foreignUuid('author_id')->constrained('users');
            $table->foreignUuid('reviewer_id')->nullable()->constrained('users');
            $table->foreignUuid('merged_by')->nullable()->constrained('users');
            $table->timestamp('merged_at')->nullable();
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('merge_requests');
    }
};
