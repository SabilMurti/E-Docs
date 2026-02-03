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
        Schema::create('space_members', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('space_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('user_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('email'); // For pending invites
            $table->enum('role', ['owner', 'editor', 'viewer'])->default('viewer');
            $table->enum('status', ['pending', 'accepted'])->default('pending');
            $table->string('invite_token')->nullable()->unique();
            $table->timestamp('invited_at')->nullable();
            $table->timestamp('accepted_at')->nullable();
            $table->timestamps();

            $table->unique(['space_id', 'email']);
            $table->index(['space_id', 'status']);
            $table->index('invite_token');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('space_members');
    }
};
