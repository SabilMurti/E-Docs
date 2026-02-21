<?php

namespace Database\Factories;

use App\Models\Branch;
use App\Models\Page;
use App\Models\Site;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Page>
 */
class PageFactory extends Factory
{
    protected $model = Page::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $title = fake()->unique()->sentence(3);

        return [
            'site_id' => Site::factory(),
            'branch_id' => Branch::factory(),
            'parent_id' => null,
            'title' => $title,
            'slug' => Str::slug($title),
            'content' => $this->generateTiptapContent(),
            'order' => 0,
            'logical_id' => Str::uuid(),
        ];
    }

    /**
     * Generate sample Tiptap JSON content.
     */
    private function generateTiptapContent(): array
    {
        return [
            'type' => 'doc',
            'content' => [
                [
                    'type' => 'paragraph',
                    'content' => [
                        [
                            'type' => 'text',
                            'text' => fake()->paragraph(),
                        ],
                    ],
                ],
            ],
        ];
    }

    /**
     * Indicate that the page belongs to a specific branch.
     */
    public function forBranch(Branch $branch): static
    {
        return $this->state(fn (array $attributes) => [
            'site_id' => $branch->site_id,
            'branch_id' => $branch->id,
        ]);
    }

    /**
     * Indicate that the page is a child of another page.
     */
    public function childOf(Page $parent): static
    {
        return $this->state(fn (array $attributes) => [
            'parent_id' => $parent->id,
        ]);
    }

    /**
     * Indicate that the page has content.
     */
    public function withContent(): static
    {
        return $this->state(fn (array $attributes) => [
            'content' => $this->generateTiptapContent(),
        ]);
    }

    /**
     * Indicate that the page is empty.
     */
    public function empty(): static
    {
        return $this->state(fn (array $attributes) => [
            'content' => null,
        ]);
    }
}
