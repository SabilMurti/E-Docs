<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pull_request_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('pull_request_id')->constrained('pull_requests')->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            
            $table->string('state')->default('pending'); // pending, approved, changes_requested, commented
            $table->text('body')->nullable();
            
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pull_request_reviews');
    }
};
