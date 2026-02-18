<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('site_id')->constrained('sites')->cascadeOnDelete();
            $table->foreignUuid('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->uuid('parent_id')->nullable(); // Hierarchical pages
            // Self-referencing FK
            $table->foreign('parent_id')->references('id')->on('pages')->onDelete('set null');

            $table->string('title');
            $table->string('slug');
            $table->json('content')->nullable(); // Can be large JSON
            $table->integer('order')->default(0);
            $table->uuid('logical_id'); // Persistent ID across branches

            $table->softDeletes();
            $table->timestamps();

            // Unique slug per branch level (optional, but good for URLs)
            // But logical_id must be unique per branch? No, logical_id is same across branches.
            // logical_id + branch_id should be unique? Yes.
            $table->unique(['branch_id', 'logical_id']);
            // slug + branch_id + parent_id should be unique? Usually yes.
            $table->unique(['branch_id', 'parent_id', 'slug'], 'pages_slug_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pages');
    }
};
