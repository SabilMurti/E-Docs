<?php

namespace Tests\Feature\Api;

use App\Models\Branch;
use App\Models\Commit;
use App\Models\CommitPage;
use App\Models\Page;
use App\Models\Site;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CommitTest extends TestCase
{
    use RefreshDatabase;

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private function makeSetup(User $user): array
    {
        $site   = Site::factory()->create(['user_id' => $user->id]);
        $branch = Branch::factory()->create(['site_id' => $site->id, 'name' => 'main', 'is_default' => true]);
        $page   = Page::create([
            'site_id'    => $site->id,
            'branch_id'  => $branch->id,
            'logical_id' => (string) Str::uuid(),
            'title'      => 'Home',
            'slug'       => 'home',
            'content'    => ['type' => 'doc', 'content' => []],
            'order'      => 0,
        ]);
        return compact('site', 'branch', 'page');
    }

    // ─── List ─────────────────────────────────────────────────────────────────

    public function test_can_list_commits_for_site(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        ['site' => $site, 'branch' => $branch] = $this->makeSetup($user);

        Commit::factory()->count(3)->create([
            'site_id'   => $site->id,
            'branch_id' => $branch->id,
            'user_id'   => $user->id,
        ]);

        $response = $this->getJson("/api/sites/{$site->id}/commits?branch_id={$branch->id}");

        $response->assertStatus(200)
            ->assertJsonCount(3, 'data');
    }

    public function test_can_filter_commits_by_branch(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        ['site' => $site, 'branch' => $branch] = $this->makeSetup($user);

        $otherBranch = Branch::factory()->create(['site_id' => $site->id, 'name' => 'feature']);

        Commit::factory()->count(2)->create(['site_id' => $site->id, 'branch_id' => $branch->id, 'user_id' => $user->id]);
        Commit::factory()->count(1)->create(['site_id' => $site->id, 'branch_id' => $otherBranch->id, 'user_id' => $user->id]);

        $response = $this->getJson("/api/sites/{$site->id}/commits?branch_id={$branch->id}");

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data');
    }

    public function test_non_member_cannot_list_commits(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        Sanctum::actingAs($other);
        ['site' => $site] = $this->makeSetup($owner);

        $this->getJson("/api/sites/{$site->id}/commits")->assertStatus(403);
    }

    // ─── Create (Page-level commit) ───────────────────────────────────────────

    public function test_can_create_commit_for_page(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        ['site' => $site, 'branch' => $branch, 'page' => $page] = $this->makeSetup($user);

        $newContent = ['type' => 'doc', 'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'Hello']]]]];

        $response = $this->postJson("/api/sites/{$site->id}/pages/{$page->id}/commits", [
            'message' => 'Initial commit',
            'content' => $newContent,
            'title'   => 'Home',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('commit.message', 'Initial commit');

        $this->assertDatabaseHas('commits', ['site_id' => $site->id, 'message' => 'Initial commit']);
    }

    public function test_commit_updates_page_content(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        ['site' => $site, 'branch' => $branch, 'page' => $page] = $this->makeSetup($user);

        $newContent = ['type' => 'doc', 'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'Updated content']]]]];

        $this->postJson("/api/sites/{$site->id}/pages/{$page->id}/commits", [
            'message' => 'Update content',
            'content' => $newContent,
            'title'   => 'Home Updated',
        ])->assertStatus(201);

        $page->refresh();
        $this->assertEquals('Home Updated', $page->title);
        $this->assertEquals($newContent, $page->content);
    }

    public function test_commit_message_is_required(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        ['site' => $site, 'branch' => $branch, 'page' => $page] = $this->makeSetup($user);

        $response = $this->postJson("/api/sites/{$site->id}/pages/{$page->id}/commits", [
            'content' => ['type' => 'doc', 'content' => []],
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['message']);
    }

    public function test_read_only_member_cannot_commit(): void
    {
        $owner  = User::factory()->create();
        $reader = User::factory()->create();
        Sanctum::actingAs($reader);
        ['site' => $site, 'branch' => $branch, 'page' => $page] = $this->makeSetup($owner);

        // Add reader as read-only member
        $site->members()->attach($reader->id, ['role' => 'read']);

        $response = $this->postJson("/api/sites/{$site->id}/pages/{$page->id}/commits", [
            'message' => 'Unauthorized commit',
            'content' => ['type' => 'doc', 'content' => []],
        ]);

        $response->assertStatus(403);
    }

    // ─── Create (Site-level multi-page commit) ────────────────────────────────

    public function test_can_create_site_level_commit(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        ['site' => $site, 'branch' => $branch, 'page' => $page] = $this->makeSetup($user);

        $response = $this->postJson("/api/sites/{$site->id}/commits", [
            'branch_id' => $branch->id,
            'message'   => 'Multi-page commit',
            'pages'     => [
                [
                    'page_id' => $page->id,
                    'action'  => 'modified',
                    'title'   => 'Home v2',
                    'content' => ['type' => 'doc', 'content' => []],
                ],
            ],
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('commit.message', 'Multi-page commit');

        $this->assertDatabaseHas('commits', ['message' => 'Multi-page commit']);
    }

    public function test_site_level_commit_requires_pages(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        ['site' => $site, 'branch' => $branch] = $this->makeSetup($user);

        $response = $this->postJson("/api/sites/{$site->id}/commits", [
            'branch_id' => $branch->id,
            'message'   => 'Empty commit',
            'pages'     => [],
        ]);

        $response->assertStatus(422);
    }

    // ─── Show ─────────────────────────────────────────────────────────────────

    public function test_can_show_commit_with_pages(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        ['site' => $site, 'branch' => $branch, 'page' => $page] = $this->makeSetup($user);

        $commit = Commit::create([
            'site_id'   => $site->id,
            'branch_id' => $branch->id,
            'user_id'   => $user->id,
            'message'   => 'Test commit',
        ]);

        CommitPage::create([
            'commit_id'        => $commit->id,
            'page_id'          => $page->id,
            'action'           => 'modified',
            'title'            => $page->title,
            'content'          => $page->content,
            'previous_content' => $page->content,
            'previous_title'   => $page->title,
        ]);

        $response = $this->getJson("/api/sites/{$site->id}/commits/{$commit->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.message', 'Test commit')
            ->assertJsonStructure(['data' => ['id', 'message', 'pages']]);
    }

    public function test_commit_records_previous_content(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        ['site' => $site, 'branch' => $branch, 'page' => $page] = $this->makeSetup($user);

        $originalContent = $page->content;
        $newContent = ['type' => 'doc', 'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'New']]]]];

        $this->postJson("/api/sites/{$site->id}/pages/{$page->id}/commits", [
            'message' => 'Change content',
            'content' => $newContent,
        ])->assertStatus(201);

        $commitPage = CommitPage::where('page_id', $page->id)->first();
        $this->assertEquals($originalContent, $commitPage->previous_content);
        $this->assertEquals($newContent, $commitPage->content);
    }
}
