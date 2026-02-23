<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    protected $model = User::class;

    /**
     * The current password being used by the factory.
     */
    protected static ?string $password = null;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'avatar_url' => fake()->optional()->imageUrl(200, 200, 'people'),
            'google_id' => null,
            'github_id' => null,
            'email_verified_at' => now(),
            'remember_token' => Str::random(10),
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    /**
     * Indicate that the user has a Google account linked.
     */
    public function withGoogle(): static
    {
        return $this->state(fn (array $attributes) => [
            'google_id' => Str::random(40),
            'avatar_url' => fake()->imageUrl(200, 200, 'people'),
        ]);
    }

    /**
     * Indicate that the user has a GitHub account linked.
     */
    public function withGithub(): static
    {
        return $this->state(fn (array $attributes) => [
            'github_id' => Str::random(40),
            'avatar_url' => fake()->imageUrl(200, 200, 'people'),
        ]);
    }
}
