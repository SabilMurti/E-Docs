<?php

namespace Tests\Feature\Api;

use App\Models\Branch;
use App\Models\Page;
use App\Models\Site;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SearchTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_search_pages_by_title(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $site   = Site::factory()->create(['user_id' => $user->id]);
        $branch = Branch::factory()->create(['site_id' => $site->id, 'name' => 'main', 'is_default' => true]);

        Page::create([
            'site_id'    => $site->id,
            'branch_id'  => $branch->id,
            'logical_id' => (string) Str::uuid(),
            'title'      => 'Alpha Bravo',
            'slug'       => 'alpha-bravo',
            'content'    => ['type' => 'doc', 'content' => []],
            'order'      => 0,
        ]);

        Page::create([
            'site_id'    => $site->id,
            'branch_id'  => $branch->id,
            'logical_id' => (string) Str::uuid(),
            'title'      => 'Charlie Delta',
            'slug'       => 'charlie-delta',
            'content'    => ['type' => 'doc', 'content' => []],
            'order'      => 1,
        ]);

        $response = $this->getJson("/api/sites/{$site->id}/search?q=Alpha&branch_id={$branch->id}");

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data');

        $this->assertEquals('Alpha Bravo', $response->json('data.0.title'));
    }

    public function test_search_returns_empty_for_no_match(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $site   = Site::factory()->create(['user_id' => $user->id]);
        $branch = Branch::factory()->create(['site_id' => $site->id, 'name' => 'main', 'is_default' => true]);

        Page::create([
            'site_id'    => $site->id,
            'branch_id'  => $branch->id,
            'logical_id' => (string) Str::uuid(),
            'title'      => 'Hello World',
            'slug'       => 'hello-world',
            'content'    => ['type' => 'doc', 'content' => []],
            'order'      => 0,
        ]);

        $response = $this->getJson("/api/sites/{$site->id}/search?q=XYZ_NOTFOUND&branch_id={$branch->id}");

        $response->assertStatus(200)
            ->assertJsonCount(0, 'data');
    }

    public function test_search_requires_query_param(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $site = Site::factory()->create(['user_id' => $user->id]);

        $response = $this->getJson("/api/sites/{$site->id}/search");

        $response->assertStatus(422);
    }
}
