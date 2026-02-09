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
        // Sites table - main entity for documentation sites
        Schema::create('sites', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('logo_url')->nullable();
            $table->json('settings')->nullable(); // colors, footer, navigation options
            $table->boolean('is_published')->default(false);
            $table->timestamps();
            $table->softDeletes();

            $table->index('user_id');
            $table->index('is_published');
        });

        // Pivot table for Site <-> Space many-to-many relationship
        Schema::create('site_spaces', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('site_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('space_id')->constrained()->cascadeOnDelete();
            $table->string('label')->nullable(); // Custom label for space in this site
            $table->string('icon')->nullable(); // Custom icon
            $table->integer('order')->default(0);
            $table->boolean('is_home')->default(false); // Is this the home page?
            $table->timestamps();

            $table->unique(['site_id', 'space_id']);
            $table->index('site_id');
            $table->index('space_id');
        });

        // Add site_id to spaces (required - space must belong to at least one site)
        // But since it's many-to-many via pivot, we don't need FK on spaces table
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('site_spaces');
        Schema::dropIfExists('sites');
    }
};
