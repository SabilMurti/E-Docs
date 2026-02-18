<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pull_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('site_id')->constrained('sites')->cascadeOnDelete();
            
            // Branches
            $table->foreignUuid('source_branch_id')->constrained('branches')->cascadeOnDelete();
            $table->foreignUuid('target_branch_id')->constrained('branches')->cascadeOnDelete();
            
            $table->foreignUuid('author_id')->constrained('users')->cascadeOnDelete();
            
            $table->integer('number'); // PR #1, #2... per site
            $table->string('title');
            $table->text('description')->nullable();
            
            $table->string('status')->default('open'); // open, merged, closed, draft
            
            $table->foreignUuid('merged_by')->nullable()->constrained('users');
            $table->timestamp('merged_at')->nullable();
            $table->timestamp('closed_at')->nullable();
            
            $table->timestamps();

            $table->unique(['site_id', 'number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pull_requests');
    }
};
