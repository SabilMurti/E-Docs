<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Commit>
 */
class CommitFactory extends Factory
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
            'user_id' => \App\Models\User::factory(),
            'message' => $this->faker->sentence,
            'hash' => $this->faker->sha1,
        ];
    }
}
