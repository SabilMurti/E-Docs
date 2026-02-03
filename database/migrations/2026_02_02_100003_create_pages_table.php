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
        Schema::create('pages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('space_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('parent_id')->nullable()->constrained('pages')->nullOnDelete();
            $table->string('title');
            $table->string('slug');
            $table->json('content')->nullable(); // Tiptap JSON format
            $table->integer('order')->default(0);
            $table->boolean('is_published')->default(true);
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUuid('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['space_id', 'slug']);
            $table->index(['space_id', 'parent_id']);
            $table->index(['space_id', 'order']);
            
            // FULLTEXT index for search (MySQL/Postgres)
            if (config('database.default') !== 'sqlite') {
                $table->fullText(['title']);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pages');
    }
};
