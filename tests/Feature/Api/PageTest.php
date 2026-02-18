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

class PageTest extends TestCase
{
    use RefreshDatabase;

    private function makeSetup(User $user): array
    {
        $site   = Site::factory()->create(['user_id' => $user->id]);
        $branch = Branch::factory()->create(['site_id' => $site->id, 'name' => 'main', 'is_default' => true]);
        return compact('site', 'branch');
    }

    public function test_can_create_root_page(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        ['site' => $site, 'branch' => $branch] = $this->makeSetup($user);

        $response = $this->postJson("/api/sites/{$site->id}/pages", [
            'branch_id' => $branch->id,
            'title'     => 'Getting Started',
            'slug'      => 'getting-started',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.title', 'Getting Started');

        $this->assertDatabaseHas('pages', ['title' => 'Getting Started', 'site_id' => $site->id]);
    }

    public function test_can_create_child_page(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        ['site' => $site, 'branch' => $branch] = $this->makeSetup($user);

        $parent = Page::create([
            'site_id'    => $site->id,
            'branch_id'  => $branch->id,
            'logical_id' => (string) Str::uuid(),
            'title'      => 'Parent',
            'slug'       => 'parent',
            'content'    => ['type' => 'doc', 'content' => []],
            'order'      => 0,
        ]);

        $response = $this->postJson("/api/sites/{$site->id}/pages", [
            'branch_id' => $branch->id,
            'title'     => 'Child Page',
            'slug'      => 'child-page',
            'parent_id' => $parent->id,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.parent_id', $parent->id);
    }

    public function test_can_list_pages_tree(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        ['site' => $site, 'branch' => $branch] = $this->makeSetup($user);

        Page::create(['site_id' => $site->id, 'branch_id' => $branch->id, 'logical_id' => (string) Str::uuid(), 'title' => 'Page 1', 'slug' => 'page-1', 'content' => ['type' => 'doc', 'content' => []], 'order' => 0]);
        Page::create(['site_id' => $site->id, 'branch_id' => $branch->id, 'logical_id' => (string) Str::uuid(), 'title' => 'Page 2', 'slug' => 'page-2', 'content' => ['type' => 'doc', 'content' => []], 'order' => 1]);

        $response = $this->getJson("/api/sites/{$site->id}/pages?branch_id={$branch->id}");

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data');
    }

    public function test_can_update_page(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        ['site' => $site, 'branch' => $branch] = $this->makeSetup($user);

        $page = Page::create(['site_id' => $site->id, 'branch_id' => $branch->id, 'logical_id' => (string) Str::uuid(), 'title' => 'Old', 'slug' => 'old', 'content' => ['type' => 'doc', 'content' => []], 'order' => 0]);

        $response = $this->putJson("/api/sites/{$site->id}/pages/{$page->id}", [
            'title'   => 'New Title',
            'content' => ['type' => 'doc', 'content' => []],
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.title', 'New Title');
    }

    public function test_can_delete_page(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        ['site' => $site, 'branch' => $branch] = $this->makeSetup($user);

        $page = Page::create(['site_id' => $site->id, 'branch_id' => $branch->id, 'logical_id' => (string) Str::uuid(), 'title' => 'Delete Me', 'slug' => 'delete-me', 'content' => ['type' => 'doc', 'content' => []], 'order' => 0]);

        $response = $this->deleteJson("/api/sites/{$site->id}/pages/{$page->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('pages', ['id' => $page->id]);
    }

    public function test_can_reorder_pages(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        ['site' => $site, 'branch' => $branch] = $this->makeSetup($user);

        $p1 = Page::create(['site_id' => $site->id, 'branch_id' => $branch->id, 'logical_id' => (string) Str::uuid(), 'title' => 'P1', 'slug' => 'p1', 'content' => ['type' => 'doc', 'content' => []], 'order' => 0]);
        $p2 = Page::create(['site_id' => $site->id, 'branch_id' => $branch->id, 'logical_id' => (string) Str::uuid(), 'title' => 'P2', 'slug' => 'p2', 'content' => ['type' => 'doc', 'content' => []], 'order' => 1]);

        $response = $this->postJson("/api/sites/{$site->id}/pages/reorder", [
            'branch_id' => $branch->id,
            'pages'     => [
                ['id' => $p2->id, 'order' => 0, 'parent_id' => null],
                ['id' => $p1->id, 'order' => 1, 'parent_id' => null],
            ],
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('pages', ['id' => $p2->id, 'order' => 0]);
        $this->assertDatabaseHas('pages', ['id' => $p1->id, 'order' => 1]);
    }

    public function test_non_member_cannot_create_page(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        Sanctum::actingAs($other);
        $site   = Site::factory()->create(['user_id' => $owner->id]);
        $branch = Branch::factory()->create(['site_id' => $site->id]);

        $response = $this->postJson("/api/sites/{$site->id}/pages", [
            'branch_id' => $branch->id,
            'title'     => 'Hack',
            'slug'      => 'hack',
        ]);

        $response->assertStatus(403);
    }
}
