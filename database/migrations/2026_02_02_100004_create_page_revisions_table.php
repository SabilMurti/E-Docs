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
        Schema::create('page_revisions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('page_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('user_id')->nullable()->constrained()->nullOnDelete();
            $table->json('content'); // Snapshot of content
            $table->string('title'); // Snapshot of title
            $table->unsignedInteger('revision_number');
            $table->string('change_summary')->nullable();
            $table->timestamp('created_at');

            $table->index(['page_id', 'revision_number']);
            $table->index(['page_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('page_revisions');
    }
};
