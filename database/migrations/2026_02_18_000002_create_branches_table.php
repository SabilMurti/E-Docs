<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('branches', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('site_id')->constrained('sites')->cascadeOnDelete();
            $table->string('name');
            $table->boolean('is_default')->default(false);
            // Self-referencing FK for branch history/parent
            $table->uuid('parent_branch_id')->nullable(); 
            // In SQLite, we can't easily add FK constraints to self-referencing tables inside create() sometimes, 
            // but Laravel handles it well usually. Let's try standard approach.
            $table->foreign('parent_branch_id')->references('id')->on('branches')->nullOnDelete();
            
            $table->softDeletes();
            $table->timestamps();

            $table->unique(['site_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('branches');
    }
};
