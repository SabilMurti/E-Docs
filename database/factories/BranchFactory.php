<?php

namespace Database\Factories;

use App\Models\Branch;
use App\Models\Site;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Branch>
 */
class BranchFactory extends Factory
{
    protected $model = Branch::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'site_id' => Site::factory(),
            'name' => fake()->unique()->word(),
            'is_default' => false,
            'parent_branch_id' => null,
        ];
    }

    /**
     * Indicate that the branch is the default branch.
     */
    public function default(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => 'main',
            'is_default' => true,
        ]);
    }

    /**
     * Indicate that the branch belongs to a specific site.
     */
    public function forSite(Site $site): static
    {
        return $this->state(fn (array $attributes) => [
            'site_id' => $site->id,
        ]);
    }
}
