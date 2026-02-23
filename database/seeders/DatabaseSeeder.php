<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Branch;
use App\Models\Page;
use App\Models\Site;
use App\Models\SiteMember;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create a test user
        $testUser = User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

        // Create additional users
        $users = User::factory()->count(5)->create();
        $users->prepend($testUser);

        // Create sites for each user
        $users->each(function ($user) use ($users) {
            // Create site
            $site = Site::factory()
                ->published()
                ->forUser($user)
                ->create();

            // Create default 'main' branch
            $mainBranch = Branch::factory()
                ->default()
                ->forSite($site)
                ->create();

            // Create some additional branches
            Branch::factory()
                ->count(2)
                ->forSite($site)
                ->create();

            // Create pages in main branch
            $rootPages = Page::factory()
                ->count(3)
                ->forBranch($mainBranch)
                ->create();

            // Create child pages
            $rootPages->each(function ($parent) use ($mainBranch) {
                Page::factory()
                    ->count(rand(1, 3))
                    ->forBranch($mainBranch)
                    ->childOf($parent)
                    ->create();
            });

            // Add random members to the site (except for first user)
            if ($user->id !== $users->first()->id) {
                $randomMembers = $users->random(rand(1, 3));
                foreach ($randomMembers as $member) {
                    if ($member->id !== $user->id) {
                        SiteMember::create([
                            'site_id' => $site->id,
                            'user_id' => $member->id,
                            'role' => fake()->randomElement(UserRole::values()),
                        ]);
                    }
                }
            }
        });

        // Create a demo site with rich content
        $this->createDemoSite($testUser);
    }

    /**
     * Create a demo site with sample documentation content.
     */
    private function createDemoSite(User $user): void
    {
        $site = Site::factory()->create([
            'user_id' => $user->id,
            'name' => 'Demo Documentation',
            'slug' => 'demo-docs-' . Str::random(6),
            'description' => 'A demo documentation site showcasing the platform features',
            'is_published' => true,
            'settings' => [
                'theme' => 'dark',
                'accent_color' => '#10b981',
                'show_footer' => true,
            ],
        ]);

        // Create main branch
        $mainBranch = Branch::factory()->create([
            'site_id' => $site->id,
            'name' => 'main',
            'is_default' => true,
        ]);

        // Create Getting Started page
        $gettingStarted = Page::factory()->create([
            'branch_id' => $mainBranch->id,
            'site_id' => $site->id,
            'title' => 'Getting Started',
            'content' => [
                'type' => 'doc',
                'content' => [
                    [
                        'type' => 'heading',
                        'attrs' => ['level' => 1],
                        'content' => [
                            ['type' => 'text', 'text' => 'Welcome to E-Document!'],
                        ],
                    ],
                    [
                        'type' => 'paragraph',
                        'content' => [
                            ['type' => 'text', 'text' => 'E-Document is a GitBook-like documentation platform built with Laravel and React.'],
                        ],
                    ],
                    [
                        'type' => 'heading',
                        'attrs' => ['level' => 2],
                        'content' => [
                            ['type' => 'text', 'text' => 'Key Features'],
                        ],
                    ],
                    [
                        'type' => 'bulletList',
                        'content' => [
                            [
                                'type' => 'listItem',
                                'content' => [
                                    ['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => '📝 Rich text editor with Tiptap']]],
                                ],
                            ],
                            [
                                'type' => 'listItem',
                                'content' => [
                                    ['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => '🌿 Git-like branching and merging']]],
                                ],
                            ],
                            [
                                'type' => 'listItem',
                                'content' => [
                                    ['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => '👥 Team collaboration with roles']]],
                                ],
                            ],
                            [
                                'type' => 'listItem',
                                'content' => [
                                    ['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => '🔍 Full-text search']]],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
            'order' => 0,
        ]);

        // Create API Documentation page
        Page::factory()->create([
            'branch_id' => $mainBranch->id,
            'site_id' => $site->id,
            'title' => 'API Documentation',
            'content' => [
                'type' => 'doc',
                'content' => [
                    [
                        'type' => 'heading',
                        'attrs' => ['level' => 1],
                        'content' => [['type' => 'text', 'text' => 'API Reference']],
                    ],
                    [
                        'type' => 'paragraph',
                        'content' => [['type' => 'text', 'text' => 'The E-Document API is a RESTful API that allows you to manage your documentation programmatically.']],
                    ],
                    [
                        'type' => 'codeBlock',
                        'attrs' => ['language' => 'bash'],
                        'content' => [
                            ['type' => 'text', 'text' => 'curl -H "Authorization: Bearer YOUR_TOKEN" \\\n  https://api.edocument.com/api/sites'],
                        ],
                    ],
                ],
            ],
            'order' => 1,
        ]);

        // Create a feature branch with different content
        $featureBranch = Branch::factory()->create([
            'site_id' => $site->id,
            'name' => 'feature-updates',
            'is_default' => false,
            'parent_branch_id' => $mainBranch->id,
        ]);

        // Copy pages to feature branch
        $mainBranch->pages->each(function ($page) use ($featureBranch) {
            Page::create([
                'site_id' => $featureBranch->site_id,
                'branch_id' => $featureBranch->id,
                'parent_id' => null,
                'title' => $page->title . ' (Draft)',
                'slug' => $page->slug . '-draft',
                'content' => $page->content,
                'order' => $page->order,
                'logical_id' => $page->logical_id,
            ]);
        });
    }
}
