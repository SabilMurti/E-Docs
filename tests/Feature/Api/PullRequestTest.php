<?php

namespace Tests\Feature\Api;

use App\Models\Branch;
use App\Models\Commit;
use App\Models\CommitPage;
use App\Models\Page;
use App\Models\PullRequest;
use App\Models\PullRequestReview;
use App\Models\Site;
use App\Models\SiteMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PullRequestTest extends TestCase
{
    use RefreshDatabase;

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private function setupSiteWithBranches(User $user): array
    {
        $site = Site::factory()->create(['user_id' => $user->id]);

        $main = Branch::factory()->create([
            'site_id'    => $site->id,
            'name'       => 'main',
            'is_default' => true,
        ]);

        $feature = Branch::factory()->create([
            'site_id' => $site->id,
            'name'    => 'feature',
        ]);

        return compact('site', 'main', 'feature');
    }

    private function createPageOnBranch(Site $site, Branch $branch, string $title, array $content = [], ?string $logicalId = null): Page
    {
        return Page::create([
            'site_id'    => $site->id,
            'branch_id'  => $branch->id,
            'logical_id' => $logicalId ?? (string) Str::uuid(),
            'title'      => $title,
            'slug'       => Str::slug($title) . '-' . Str::random(4),
            'content'    => $content ?: ['type' => 'doc', 'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => $title]]]]],
            'order'      => 0,
        ]);
    }

    private function createCommitForPage(Site $site, Branch $branch, User $user, Page $page, string $message = 'Test commit', ?array $previousContent = null): Commit
    {
        $commit = Commit::create([
            'site_id'   => $site->id,
            'branch_id' => $branch->id,
            'user_id'   => $user->id,
            'message'   => $message,
        ]);

        CommitPage::create([
            'commit_id'        => $commit->id,
            'page_id'          => $page->id,
            'action'           => 'modified',
            'title'            => $page->title,
            'content'          => $page->content,
            'previous_content' => $previousContent ?? $page->content,
            'previous_title'   => $page->title,
        ]);

        return $commit;
    }

    private function makePr(Site $site, Branch $source, Branch $target, User $author, string $title = 'Test PR', string $status = 'open'): PullRequest
    {
        return PullRequest::create([
            'site_id'          => $site->id,
            'source_branch_id' => $source->id,
            'target_branch_id' => $target->id,
            'author_id'        => $author->id,
            'number'           => PullRequest::nextNumber($site->id),
            'title'            => $title,
            'status'           => $status,
        ]);
    }

    // ─── Index ─────────────────────────────────────────────────────────────────

    public function test_can_list_open_pull_requests(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        ['site' => $site, 'main' => $main, 'feature' => $feature] = $this->setupSiteWithBranches($user);

        $this->makePr($site, $feature, $main, $user, 'Feature PR');

        $response = $this->getJson("/api/sites/{$site->id}/pulls");

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Feature PR');
    }

    public function test_can_filter_pull_requests_by_status(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        ['site' => $site, 'main' => $main, 'feature' => $feature] = $this->setupSiteWithBranches($user);

        $this->makePr($site, $feature, $main, $user, 'Open PR', 'open');
        $this->makePr($site, $feature, $main, $user, 'Closed PR', 'closed');

        $response = $this->getJson("/api/sites/{$site->id}/pulls?status=closed");

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Closed PR');
    }

    public function test_non_member_cannot_list_pull_requests(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        Sanctum::actingAs($other);
        ['site' => $site] = $this->setupSiteWithBranches($owner);

        $this->getJson("/api/sites/{$site->id}/pulls")->assertStatus(403);
    }

    // ─── Store ─────────────────────────────────────────────────────────────────

    public function test_can_create_pull_request(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        ['site' => $site, 'main' => $main, 'feature' => $feature] = $this->setupSiteWithBranches($user);

        $response = $this->postJson("/api/sites/{$site->id}/pulls", [
            'source_branch_id' => $feature->id,
            'target_branch_id' => $main->id,
            'title'            => 'My Feature',
            'description'      => 'Adding new feature',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.title', 'My Feature')
            ->assertJsonPath('data.status', 'open');

        $this->assertDatabaseHas('pull_requests', ['title' => 'My Feature', 'site_id' => $site->id]);
    }

    public function test_can_create_draft_pull_request(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        ['site' => $site, 'main' => $main, 'feature' => $feature] = $this->setupSiteWithBranches($user);

        $response = $this->postJson("/api/sites/{$site->id}/pulls", [
            'source_branch_id' => $feature->id,
            'target_branch_id' => $main->id,
            'title'            => 'Draft PR',
            'status'           => 'draft',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.status', 'draft');
    }

    public function test_cannot_create_pr_with_same_source_and_target(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        ['site' => $site, 'main' => $main] = $this->setupSiteWithBranches($user);

        $response = $this->postJson("/api/sites/{$site->id}/pulls", [
            'source_branch_id' => $main->id,
            'target_branch_id' => $main->id,
            'title'            => 'Bad PR',
        ]);

        $response->assertStatus(422);
    }

    public function test_pr_number_auto_increments(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        ['site' => $site, 'main' => $main, 'feature' => $feature] = $this->setupSiteWithBranches($user);

        $r1 = $this->postJson("/api/sites/{$site->id}/pulls", ['source_branch_id' => $feature->id, 'target_branch_id' => $main->id, 'title' => 'PR 1']);
        $r2 = $this->postJson("/api/sites/{$site->id}/pulls", ['source_branch_id' => $feature->id, 'target_branch_id' => $main->id, 'title' => 'PR 2']);

        $this->assertEquals(1, $r1->json('data.number'));
        $this->assertEquals(2, $r2->json('data.number'));
    }

    public function test_read_only_member_cannot_create_pr(): void
    {
        $owner  = User::factory()->create();
        $reader = User::factory()->create();
        Sanctum::actingAs($reader);
        ['site' => $site, 'main' => $main, 'feature' => $feature] = $this->setupSiteWithBranches($owner);

        $site->members()->attach($reader->id, ['role' => 'read']);

        $response = $this->postJson("/api/sites/{$site->id}/pulls", [
            'source_branch_id' => $feature->id,
            'target_branch_id' => $main->id,
            'title'            => 'Unauthorized PR',
        ]);

        $response->assertStatus(403);
    }

    // ─── Show ──────────────────────────────────────────────────────────────────

    public function test_can_show_pull_request_with_diff(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        ['site' => $site, 'main' => $main, 'feature' => $feature] = $this->setupSiteWithBranches($user);

        $logicalId   = (string) Str::uuid();
        $mainPage    = $this->createPageOnBranch($site, $main, 'Home', [], $logicalId);
        $featurePage = $this->createPageOnBranch($site, $feature, 'Home Updated', [], $logicalId);
        $this->createCommitForPage($site, $feature, $user, $featurePage, 'Update home', $mainPage->content);

        $pr = $this->makePr($site, $feature, $main, $user, 'Update Home');

        $response = $this->getJson("/api/sites/{$site->id}/pulls/{$pr->id}");

        $response->assertStatus(200)
            ->assertJsonStructure(['pull_request', 'changes'])
            ->assertJsonPath('pull_request.title', 'Update Home');
    }

    public function test_show_pr_includes_changes_for_new_page(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        ['site' => $site, 'main' => $main, 'feature' => $feature] = $this->setupSiteWithBranches($user);

        $newPage = $this->createPageOnBranch($site, $feature, 'Brand New Page');
        $this->createCommitForPage($site, $feature, $user, $newPage, 'Add new page');

        $pr = $this->makePr($site, $feature, $main, $user, 'Add Page');

        $response = $this->getJson("/api/sites/{$site->id}/pulls/{$pr->id}");

        $response->assertStatus(200);
        $changes = $response->json('changes');
        $this->assertNotEmpty($changes);
        $this->assertEquals('added', $changes[0]['type']);
    }

    // ─── Update ────────────────────────────────────────────────────────────────

    public function test_author_can_update_pr_title(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        ['site' => $site, 'main' => $main, 'feature' => $feature] = $this->setupSiteWithBranches($user);

        $pr = $this->makePr($site, $feature, $main, $user, 'Old Title');

        $response = $this->putJson("/api/sites/{$site->id}/pulls/{$pr->id}", ['title' => 'New Title']);

        $response->assertStatus(200)
            ->assertJsonPath('data.title', 'New Title');
    }

    public function test_author_can_convert_draft_to_open(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        ['site' => $site, 'main' => $main, 'feature' => $feature] = $this->setupSiteWithBranches($user);

        $pr = $this->makePr($site, $feature, $main, $user, 'Draft PR', 'draft');

        $response = $this->putJson("/api/sites/{$site->id}/pulls/{$pr->id}", ['status' => 'open']);

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'open');
    }

    public function test_non_author_cannot_update_pr(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        Sanctum::actingAs($other);
        ['site' => $site, 'main' => $main, 'feature' => $feature] = $this->setupSiteWithBranches($owner);

        $pr = $this->makePr($site, $feature, $main, $owner, 'PR');

        $response = $this->putJson("/api/sites/{$site->id}/pulls/{$pr->id}", ['title' => 'Hacked']);

        $response->assertStatus(403);
    }

    // ─── Close ─────────────────────────────────────────────────────────────────

    public function test_author_can_close_pr(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        ['site' => $site, 'main' => $main, 'feature' => $feature] = $this->setupSiteWithBranches($user);

        $pr = $this->makePr($site, $feature, $main, $user);

        $response = $this->postJson("/api/sites/{$site->id}/pulls/{$pr->id}/close");

        $response->assertStatus(200);
        $this->assertDatabaseHas('pull_requests', ['id' => $pr->id, 'status' => 'closed']);
    }

    public function test_cannot_close_merged_pr(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        ['site' => $site, 'main' => $main, 'feature' => $feature] = $this->setupSiteWithBranches($user);

        $pr = $this->makePr($site, $feature, $main, $user, 'PR', 'merged');
        $pr->update(['merged_at' => now(), 'merged_by' => $user->id]);

        $response = $this->postJson("/api/sites/{$site->id}/pulls/{$pr->id}/close");

        $response->assertStatus(400);
    }

    public function test_maintainer_can_close_others_pr(): void
    {
        $owner      = User::factory()->create();
        $maintainer = User::factory()->create();
        Sanctum::actingAs($maintainer);
        ['site' => $site, 'main' => $main, 'feature' => $feature] = $this->setupSiteWithBranches($owner);

        $site->members()->attach($maintainer->id, ['role' => 'maintain']);

        $pr = $this->makePr($site, $feature, $main, $owner);

        $this->postJson("/api/sites/{$site->id}/pulls/{$pr->id}/close")->assertStatus(200);
    }

    // ─── Merge ─────────────────────────────────────────────────────────────────

    public function test_can_merge_pr_without_conflicts(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        ['site' => $site, 'main' => $main, 'feature' => $feature] = $this->setupSiteWithBranches($user);

        // New page only in feature branch (no conflict)
        $newPage = $this->createPageOnBranch($site, $feature, 'New Feature Page');
        $this->createCommitForPage($site, $feature, $user, $newPage, 'Add new page');

        $pr = $this->makePr($site, $feature, $main, $user, 'Add page');

        $response = $this->postJson("/api/sites/{$site->id}/pulls/{$pr->id}/merge");

        $response->assertStatus(200);
        $this->assertDatabaseHas('pull_requests', ['id' => $pr->id, 'status' => 'merged']);
        // Page should now exist in main branch
        $this->assertDatabaseHas('pages', ['site_id' => $site->id, 'branch_id' => $main->id, 'title' => 'New Feature Page']);
    }

    public function test_merge_updates_existing_page_on_target(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        ['site' => $site, 'main' => $main, 'feature' => $feature] = $this->setupSiteWithBranches($user);

        $logicalId   = (string) Str::uuid();
        $baseContent = ['type' => 'doc', 'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'Base']]]]];
        $newContent  = ['type' => 'doc', 'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'Updated in feature']]]]];

        $mainPage    = $this->createPageOnBranch($site, $main, 'Home', $baseContent, $logicalId);
        $featurePage = $this->createPageOnBranch($site, $feature, 'Home', $newContent, $logicalId);
        $this->createCommitForPage($site, $feature, $user, $featurePage, 'Update home', $baseContent);

        $pr = $this->makePr($site, $feature, $main, $user, 'Update Home');

        $this->postJson("/api/sites/{$site->id}/pulls/{$pr->id}/merge")->assertStatus(200);

        $mainPage->refresh();
        $this->assertEquals($newContent, $mainPage->content);
    }

    public function test_merge_blocked_when_conflicts_exist(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        ['site' => $site, 'main' => $main, 'feature' => $feature] = $this->setupSiteWithBranches($user);

        $logicalId      = (string) Str::uuid();
        $baseContent    = ['type' => 'doc', 'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'Base']]]]];
        $mainContent    = ['type' => 'doc', 'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'Main changed']]]]];
        $featureContent = ['type' => 'doc', 'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'Feature changed']]]]];

        // Both branches modified the same page from a different base
        $mainPage    = $this->createPageOnBranch($site, $main, 'Home', $mainContent, $logicalId);
        $featurePage = $this->createPageOnBranch($site, $feature, 'Home', $featureContent, $logicalId);

        // Commit in feature branch with base = original content (not main's current)
        $this->createCommitForPage($site, $feature, $user, $featurePage, 'Feature edit', $baseContent);

        $pr = $this->makePr($site, $feature, $main, $user, 'Conflict PR');

        $response = $this->postJson("/api/sites/{$site->id}/pulls/{$pr->id}/merge");

        $response->assertStatus(422)
            ->assertJsonStructure(['message', 'conflicts']);
    }

    public function test_cannot_merge_closed_pr(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        ['site' => $site, 'main' => $main, 'feature' => $feature] = $this->setupSiteWithBranches($user);

        $pr = $this->makePr($site, $feature, $main, $user, 'PR', 'closed');

        $response = $this->postJson("/api/sites/{$site->id}/pulls/{$pr->id}/merge");

        $response->assertStatus(400);
    }

    public function test_write_only_member_cannot_merge(): void
    {
        $owner  = User::factory()->create();
        $writer = User::factory()->create();
        Sanctum::actingAs($writer);
        ['site' => $site, 'main' => $main, 'feature' => $feature] = $this->setupSiteWithBranches($owner);

        $site->members()->attach($writer->id, ['role' => 'write']);

        $newPage = $this->createPageOnBranch($site, $feature, 'New Page');
        $this->createCommitForPage($site, $feature, $owner, $newPage, 'Add page');

        $pr = $this->makePr($site, $feature, $main, $owner, 'PR');

        $this->postJson("/api/sites/{$site->id}/pulls/{$pr->id}/merge")->assertStatus(403);
    }

    // ─── Resolve Conflicts ─────────────────────────────────────────────────────

    public function test_can_resolve_conflicts_and_then_merge(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        ['site' => $site, 'main' => $main, 'feature' => $feature] = $this->setupSiteWithBranches($user);

        $logicalId       = (string) Str::uuid();
        $baseContent     = ['type' => 'doc', 'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'Base']]]]];
        $mainContent     = ['type' => 'doc', 'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'Main changed']]]]];
        $featureContent  = ['type' => 'doc', 'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'Feature changed']]]]];
        $resolvedContent = ['type' => 'doc', 'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'Resolved']]]]];

        $mainPage    = $this->createPageOnBranch($site, $main, 'Home', $mainContent, $logicalId);
        $featurePage = $this->createPageOnBranch($site, $feature, 'Home', $featureContent, $logicalId);
        $this->createCommitForPage($site, $feature, $user, $featurePage, 'Feature edit', $baseContent);

        $pr = $this->makePr($site, $feature, $main, $user, 'Conflict PR');

        // Step 1: Resolve conflicts
        $resolveResponse = $this->postJson("/api/sites/{$site->id}/pulls/{$pr->id}/resolve", [
            'resolutions' => [[
                'logical_id' => $logicalId,
                'title'      => 'Home',
                'content'    => $resolvedContent,
            ]],
        ]);
        $resolveResponse->assertStatus(200);

        // Step 2: Merge should now succeed (conflicts cleared)
        $mergeResponse = $this->postJson("/api/sites/{$site->id}/pulls/{$pr->id}/merge");
        $mergeResponse->assertStatus(200);
        $this->assertDatabaseHas('pull_requests', ['id' => $pr->id, 'status' => 'merged']);

        // Verify resolved content is on main branch
        $mainPage->refresh();
        $this->assertEquals($resolvedContent, $mainPage->content);
    }

    public function test_resolve_creates_a_commit_in_source_branch(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        ['site' => $site, 'main' => $main, 'feature' => $feature] = $this->setupSiteWithBranches($user);

        $logicalId      = (string) Str::uuid();
        $baseContent    = ['type' => 'doc', 'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'Base']]]]];
        $mainContent    = ['type' => 'doc', 'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'Main changed']]]]];
        $featureContent = ['type' => 'doc', 'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'Feature changed']]]]];
        $resolved       = ['type' => 'doc', 'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'Resolved']]]]];

        $this->createPageOnBranch($site, $main, 'Home', $mainContent, $logicalId);
        $featurePage = $this->createPageOnBranch($site, $feature, 'Home', $featureContent, $logicalId);
        $this->createCommitForPage($site, $feature, $user, $featurePage, 'Feature edit', $baseContent);

        $pr = $this->makePr($site, $feature, $main, $user, 'Conflict PR');

        $this->postJson("/api/sites/{$site->id}/pulls/{$pr->id}/resolve", [
            'resolutions' => [['logical_id' => $logicalId, 'title' => 'Home', 'content' => $resolved]],
        ])->assertStatus(200);

        // A resolution commit should be created in the feature branch
        $this->assertDatabaseHas('commits', [
            'branch_id' => $feature->id,
            'site_id'   => $site->id,
        ]);
    }

    public function test_cannot_resolve_closed_pr(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        ['site' => $site, 'main' => $main, 'feature' => $feature] = $this->setupSiteWithBranches($user);

        $pr = $this->makePr($site, $feature, $main, $user, 'PR', 'closed');

        $response = $this->postJson("/api/sites/{$site->id}/pulls/{$pr->id}/resolve", [
            'resolutions' => [['logical_id' => (string) Str::uuid(), 'title' => 'X', 'content' => []]],
        ]);

        $response->assertStatus(400);
    }

    // ─── Delete ────────────────────────────────────────────────────────────────

    public function test_author_can_delete_open_pr(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        ['site' => $site, 'main' => $main, 'feature' => $feature] = $this->setupSiteWithBranches($user);

        $pr = $this->makePr($site, $feature, $main, $user);

        $response = $this->deleteJson("/api/sites/{$site->id}/pulls/{$pr->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('pull_requests', ['id' => $pr->id]);
    }

    public function test_cannot_delete_merged_pr(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        ['site' => $site, 'main' => $main, 'feature' => $feature] = $this->setupSiteWithBranches($user);

        $pr = $this->makePr($site, $feature, $main, $user, 'PR', 'merged');
        $pr->update(['merged_at' => now(), 'merged_by' => $user->id]);

        $response = $this->deleteJson("/api/sites/{$site->id}/pulls/{$pr->id}");

        $response->assertStatus(400);
    }

    public function test_non_author_cannot_delete_pr(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        Sanctum::actingAs($other);
        ['site' => $site, 'main' => $main, 'feature' => $feature] = $this->setupSiteWithBranches($owner);

        $pr = $this->makePr($site, $feature, $main, $owner);

        $this->deleteJson("/api/sites/{$site->id}/pulls/{$pr->id}")->assertStatus(403);
    }

    // ─── Compare ───────────────────────────────────────────────────────────────

    public function test_can_compare_branches(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        ['site' => $site, 'main' => $main, 'feature' => $feature] = $this->setupSiteWithBranches($user);

        $newPage = $this->createPageOnBranch($site, $feature, 'New Page');
        $this->createCommitForPage($site, $feature, $user, $newPage, 'Add page');

        $response = $this->getJson("/api/sites/{$site->id}/pulls/compare?source_branch_id={$feature->id}&target_branch_id={$main->id}");

        $response->assertStatus(200)
            ->assertJsonStructure(['source_branch', 'target_branch', 'changes', 'can_merge']);
    }

    public function test_compare_shows_no_changes_for_identical_branches(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        ['site' => $site, 'main' => $main, 'feature' => $feature] = $this->setupSiteWithBranches($user);

        $response = $this->getJson("/api/sites/{$site->id}/pulls/compare?source_branch_id={$feature->id}&target_branch_id={$main->id}");

        $response->assertStatus(200);
        $this->assertEmpty($response->json('changes'));
        $this->assertFalse($response->json('can_merge'));
    }

    // ─── Reviews ───────────────────────────────────────────────────────────────

    public function test_is_approved_when_all_reviewers_approved(): void
    {
        $user     = User::factory()->create();
        $reviewer = User::factory()->create();
        Sanctum::actingAs($user);
        ['site' => $site, 'main' => $main, 'feature' => $feature] = $this->setupSiteWithBranches($user);

        $pr = $this->makePr($site, $feature, $main, $user);

        PullRequestReview::create([
            'pull_request_id' => $pr->id,
            'user_id'         => $reviewer->id,
            'status'          => 'approved',
            'body'            => 'LGTM',
        ]);

        $pr->load('reviews');
        $this->assertTrue($pr->isApproved());
        $this->assertFalse($pr->hasChangesRequested());
    }

    public function test_has_changes_requested_when_reviewer_requests_changes(): void
    {
        $user     = User::factory()->create();
        $reviewer = User::factory()->create();
        ['site' => $site, 'main' => $main, 'feature' => $feature] = $this->setupSiteWithBranches($user);

        $pr = $this->makePr($site, $feature, $main, $user);

        PullRequestReview::create([
            'pull_request_id' => $pr->id,
            'user_id'         => $reviewer->id,
            'status'          => 'changes_requested',
            'body'            => 'Please fix X',
        ]);

        $pr->load('reviews');
        $this->assertFalse($pr->isApproved());
        $this->assertTrue($pr->hasChangesRequested());
    }

    public function test_not_approved_when_no_reviews(): void
    {
        $user = User::factory()->create();
        ['site' => $site, 'main' => $main, 'feature' => $feature] = $this->setupSiteWithBranches($user);

        $pr = $this->makePr($site, $feature, $main, $user);
        $pr->load('reviews');

        $this->assertFalse($pr->isApproved());
        $this->assertFalse($pr->hasChangesRequested());
    }

    public function test_can_submit_review_via_api(): void
    {
        $owner    = User::factory()->create();
        $reviewer = User::factory()->create();
        Sanctum::actingAs($reviewer);
        ['site' => $site, 'main' => $main, 'feature' => $feature] = $this->setupSiteWithBranches($owner);

        $site->members()->attach($reviewer->id, ['role' => 'write']);

        $pr = $this->makePr($site, $feature, $main, $owner);

        $response = $this->postJson("/api/sites/{$site->id}/pulls/{$pr->id}/reviews", [
            'status' => 'approved',
            'body'   => 'Looks great!',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.status', 'approved');
    }

    public function test_author_cannot_review_own_pr(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        ['site' => $site, 'main' => $main, 'feature' => $feature] = $this->setupSiteWithBranches($user);

        $pr = $this->makePr($site, $feature, $main, $user);

        $response = $this->postJson("/api/sites/{$site->id}/pulls/{$pr->id}/reviews", [
            'status' => 'approved',
            'body'   => 'Self-approve',
        ]);

        $response->assertStatus(422);
    }

    public function test_cannot_review_closed_pr(): void
    {
        $owner    = User::factory()->create();
        $reviewer = User::factory()->create();
        Sanctum::actingAs($reviewer);
        ['site' => $site, 'main' => $main, 'feature' => $feature] = $this->setupSiteWithBranches($owner);

        $site->members()->attach($reviewer->id, ['role' => 'write']);

        $pr = $this->makePr($site, $feature, $main, $owner, 'PR', 'closed');

        $response = $this->postJson("/api/sites/{$site->id}/pulls/{$pr->id}/reviews", [
            'status' => 'approved',
        ]);

        $response->assertStatus(400);
    }

    // ─── Page-level PR creation ────────────────────────────────────────────────

    public function test_can_create_pr_from_page_context(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        ['site' => $site, 'main' => $main, 'feature' => $feature] = $this->setupSiteWithBranches($user);

        $page = $this->createPageOnBranch($site, $feature, 'Feature Page');

        $response = $this->postJson("/api/pages/{$page->id}/requests", [
            'title'            => 'Feature PR from editor',
            'description'      => 'Created from editor',
            'target_branch_id' => $main->id,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.title', 'Feature PR from editor');
    }

    public function test_duplicate_pr_from_page_returns_existing(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        ['site' => $site, 'main' => $main, 'feature' => $feature] = $this->setupSiteWithBranches($user);

        $page = $this->createPageOnBranch($site, $feature, 'Feature Page');

        // Create first PR
        $this->postJson("/api/pages/{$page->id}/requests", [
            'title'            => 'First PR',
            'target_branch_id' => $main->id,
        ])->assertStatus(201);

        // Create duplicate - should return existing
        $response = $this->postJson("/api/pages/{$page->id}/requests", [
            'title'            => 'Duplicate PR',
            'target_branch_id' => $main->id,
        ]);

        $response->assertStatus(200); // Returns existing PR
        $this->assertDatabaseCount('pull_requests', 1);
    }
}
