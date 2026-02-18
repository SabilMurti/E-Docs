<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('commit_pages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('commit_id')->constrained('commits')->cascadeOnDelete();
            // Don't constrain page_id foreign key strictly because pages might be hard-deleted? 
            // Actually, we use softDeletes, so we CAN constrain it. 
            // But if we hard delete a page, we might want to keep history? 
            // Better to keep page_id as a reference. If page is hard deleted, maybe set null?
            // Standard approach: keep history even if page is gone. So nullable FK or just UUID.
            // But let's assume softDeletes for pages.
            $table->foreignUuid('page_id')->nullable()->constrained('pages')->nullOnDelete();

            $table->string('action'); // created, modified, deleted, moved
            $table->string('title')->nullable();
            $table->json('content')->nullable();
            
            // Previous state (diffing)
            $table->string('previous_title')->nullable();
            $table->json('previous_content')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('commit_pages');
    }
};
