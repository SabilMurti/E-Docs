<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Page>
 */
class PageFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'site_id' => \App\Models\Site::factory(),
            'branch_id' => \App\Models\Branch::factory(),
            'title' => $this->faker->sentence,
            'slug' => $this->faker->slug,
            'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => $this->faker->paragraph]]]],
            'logical_id' => $this->faker->uuid,
        ];
    }
}
