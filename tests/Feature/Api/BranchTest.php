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

class BranchTest extends TestCase
{
    use RefreshDatabase;

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private function makeSiteWithMain(User $user): array
    {
        $site = Site::factory()->create(['user_id' => $user->id]);
        $main = Branch::factory()->create([
            'site_id'    => $site->id,
            'name'       => 'main',
            'is_default' => true,
        ]);
        return compact('site', 'main');
    }

    // ─── List ─────────────────────────────────────────────────────────────────

    public function test_can_list_branches(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        ['site' => $site, 'main' => $main] = $this->makeSiteWithMain($user);

        Branch::factory()->count(2)->create(['site_id' => $site->id]);

        $response = $this->getJson("/api/sites/{$site->id}/branches");

        $response->assertStatus(200)
            ->assertJsonCount(3, 'data'); // main + 2 new
    }

    public function test_unauthenticated_cannot_list_branches(): void
    {
        $user = User::factory()->create();
        ['site' => $site] = $this->makeSiteWithMain($user);

        $this->getJson("/api/sites/{$site->id}/branches")->assertStatus(401);
    }

    public function test_non_member_cannot_list_branches(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        Sanctum::actingAs($other);
        ['site' => $site] = $this->makeSiteWithMain($owner);

        $this->getJson("/api/sites/{$site->id}/branches")->assertStatus(403);
    }

    // ─── Create ───────────────────────────────────────────────────────────────

    public function test_can_create_branch_from_main(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        ['site' => $site, 'main' => $main] = $this->makeSiteWithMain($user);

        $response = $this->postJson("/api/sites/{$site->id}/branches", [
            'name'          => 'feature-x',
            'source_branch' => 'main',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'feature-x');

        $this->assertDatabaseHas('branches', ['site_id' => $site->id, 'name' => 'feature-x']);
    }

    public function test_branch_clones_pages_from_source(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        ['site' => $site, 'main' => $main] = $this->makeSiteWithMain($user);

        // Create a page on main
        Page::create([
            'site_id'    => $site->id,
            'branch_id'  => $main->id,
            'logical_id' => (string) Str::uuid(),
            'title'      => 'Home',
            'slug'       => 'home',
            'content'    => ['type' => 'doc', 'content' => []],
            'order'      => 0,
        ]);

        $response = $this->postJson("/api/sites/{$site->id}/branches", [
            'name'          => 'feature-clone',
            'source_branch' => 'main',
        ]);

        $response->assertStatus(201);

        $newBranchId = $response->json('data.id');
        $this->assertDatabaseHas('pages', ['branch_id' => $newBranchId, 'title' => 'Home']);
    }

    public function test_branch_name_must_be_unique_per_site(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        ['site' => $site] = $this->makeSiteWithMain($user);

        // 'main' already exists
        $response = $this->postJson("/api/sites/{$site->id}/branches", [
            'name'          => 'main',
            'source_branch' => 'main',
        ]);

        // 'main' is reserved in validation (not_in:main) OR already exists → 422
        $response->assertStatus(422);
    }

    public function test_cannot_create_branch_named_main(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        ['site' => $site] = $this->makeSiteWithMain($user);

        $response = $this->postJson("/api/sites/{$site->id}/branches", [
            'name'          => 'main',
            'source_branch' => 'main',
        ]);

        $response->assertStatus(422);
    }

    public function test_source_branch_must_exist(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        ['site' => $site] = $this->makeSiteWithMain($user);

        $response = $this->postJson("/api/sites/{$site->id}/branches", [
            'name'          => 'feature-y',
            'source_branch' => 'nonexistent-branch',
        ]);

        $response->assertStatus(422);
    }

    public function test_non_member_cannot_create_branch(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        Sanctum::actingAs($other);
        ['site' => $site] = $this->makeSiteWithMain($owner);

        $response = $this->postJson("/api/sites/{$site->id}/branches", [
            'name'          => 'hack',
            'source_branch' => 'main',
        ]);

        $response->assertStatus(403);
    }

    // ─── Delete ───────────────────────────────────────────────────────────────

    public function test_can_delete_non_default_branch(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        ['site' => $site] = $this->makeSiteWithMain($user);

        $branch = Branch::factory()->create([
            'site_id'    => $site->id,
            'name'       => 'feature',
            'is_default' => false,
        ]);

        $response = $this->deleteJson("/api/sites/{$site->id}/branches/{$branch->id}");

        $response->assertStatus(200);
        // Branch uses SoftDeletes
        $this->assertSoftDeleted('branches', ['id' => $branch->id]);
    }

    public function test_cannot_delete_default_branch(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        ['site' => $site, 'main' => $main] = $this->makeSiteWithMain($user);

        $response = $this->deleteJson("/api/sites/{$site->id}/branches/{$main->id}");

        $response->assertStatus(400);
        $this->assertDatabaseHas('branches', ['id' => $main->id]);
    }

    public function test_deleting_branch_also_deletes_its_pages(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        ['site' => $site] = $this->makeSiteWithMain($user);

        $branch = Branch::factory()->create([
            'site_id'    => $site->id,
            'name'       => 'to-delete',
            'is_default' => false,
        ]);

        $page = Page::create([
            'site_id'    => $site->id,
            'branch_id'  => $branch->id,
            'logical_id' => (string) Str::uuid(),
            'title'      => 'Orphan Page',
            'slug'       => 'orphan',
            'content'    => ['type' => 'doc', 'content' => []],
            'order'      => 0,
        ]);

        $this->deleteJson("/api/sites/{$site->id}/branches/{$branch->id}")->assertStatus(200);

        // Pages should be soft-deleted too
        $this->assertSoftDeleted('pages', ['id' => $page->id]);
    }

    public function test_cannot_delete_branch_from_another_site(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $site1 = Site::factory()->create(['user_id' => $user->id]);
        $site2 = Site::factory()->create(['user_id' => $user->id]);

        Branch::factory()->create(['site_id' => $site1->id, 'name' => 'main', 'is_default' => true]);
        $branch2 = Branch::factory()->create(['site_id' => $site2->id, 'name' => 'feature', 'is_default' => false]);

        // Try to delete branch from site2 via site1's URL
        $response = $this->deleteJson("/api/sites/{$site1->id}/branches/{$branch2->id}");

        $response->assertStatus(404);
    }
}
