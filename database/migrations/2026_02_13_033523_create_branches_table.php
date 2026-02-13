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
        Schema::create('branches', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('site_id')->constrained('sites')->cascadeOnDelete();
            $table->string('name');
            $table->foreignUuid('created_by')->constrained('users')->cascadeOnDelete();
            $table->boolean('is_default')->default(false);
            $table->softDeletes();
            $table->timestamps();

            $table->unique(['site_id', 'name']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('branches');
    }
};
