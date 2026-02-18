<?php

namespace Tests\Feature\Api;

use App\Models\Branch;
use App\Models\Commit;
use App\Models\CommitPage;
use App\Models\Page;
use App\Models\PullRequest;
use App\Models\PullRequestReview;
use App\Models\Site;
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

    // ─── Index ─────────────────────────────────────────────────────────────────

    public function test_can_list_open_pull_requests(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        ['site' => $site, 'main' => $main, 'feature' => $feature] = $this->setupSiteWithBranches($user);

        PullRequest::create([
            'site_id'          => $site->id,
            'source_branch_id' => $feature->id,
            'target_branch_id' => $main->id,
            'author_id'        => $user->id,
            'number'           => 1,
            'title'            => 'Feature PR',
            'status'           => 'open',
        ]);

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

        PullRequest::create(['site_id' => $site->id, 'source_branch_id' => $feature->id, 'target_branch_id' => $main->id, 'author_id' => $user->id, 'number' => 1, 'title' => 'Open PR', 'status' => 'open']);
        PullRequest::create(['site_id' => $site->id, 'source_branch_id' => $feature->id, 'target_branch_id' => $main->id, 'author_id' => $user->id, 'number' => 2, 'title' => 'Closed PR', 'status' => 'closed']);

        $response = $this->getJson("/api/sites/{$site->id}/pulls?status=closed");

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Closed PR');
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

    // ─── Show ──────────────────────────────────────────────────────────────────

    public function test_can_show_pull_request_with_diff(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        ['site' => $site, 'main' => $main, 'feature' => $feature] = $this->setupSiteWithBranches($user);

        $logicalId = (string) Str::uuid();
        $mainPage    = $this->createPageOnBranch($site, $main, 'Home', [], $logicalId);
        $featurePage = $this->createPageOnBranch($site, $feature, 'Home Updated', [], $logicalId);
        $this->createCommitForPage($site, $feature, $user, $featurePage, 'Update home', $mainPage->content);

        $pr = PullRequest::create(['site_id' => $site->id, 'source_branch_id' => $feature->id, 'target_branch_id' => $main->id, 'author_id' => $user->id, 'number' => 1, 'title' => 'Update Home', 'status' => 'open']);

        $response = $this->getJson("/api/sites/{$site->id}/pulls/{$pr->id}");

        $response->assertStatus(200)
            ->assertJsonStructure(['pull_request', 'changes'])
            ->assertJsonPath('pull_request.title', 'Update Home');
    }

    // ─── Update ────────────────────────────────────────────────────────────────

    public function test_author_can_update_pr_title(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        ['site' => $site, 'main' => $main, 'feature' => $feature] = $this->setupSiteWithBranches($user);

        $pr = PullRequest::create(['site_id' => $site->id, 'source_branch_id' => $feature->id, 'target_branch_id' => $main->id, 'author_id' => $user->id, 'number' => 1, 'title' => 'Old Title', 'status' => 'open']);

        $response = $this->putJson("/api/sites/{$site->id}/pulls/{$pr->id}", ['title' => 'New Title']);

        $response->assertStatus(200)
            ->assertJsonPath('data.title', 'New Title');
    }

    public function test_non_author_cannot_update_pr(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        Sanctum::actingAs($other);
        ['site' => $site, 'main' => $main, 'feature' => $feature] = $this->setupSiteWithBranches($owner);

        $pr = PullRequest::create(['site_id' => $site->id, 'source_branch_id' => $feature->id, 'target_branch_id' => $main->id, 'author_id' => $owner->id, 'number' => 1, 'title' => 'PR', 'status' => 'open']);

        $response = $this->putJson("/api/sites/{$site->id}/pulls/{$pr->id}", ['title' => 'Hacked']);

        $response->assertStatus(403);
    }

    // ─── Close ─────────────────────────────────────────────────────────────────

    public function test_author_can_close_pr(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        ['site' => $site, 'main' => $main, 'feature' => $feature] = $this->setupSiteWithBranches($user);

        $pr = PullRequest::create(['site_id' => $site->id, 'source_branch_id' => $feature->id, 'target_branch_id' => $main->id, 'author_id' => $user->id, 'number' => 1, 'title' => 'PR', 'status' => 'open']);

        $response = $this->postJson("/api/sites/{$site->id}/pulls/{$pr->id}/close");

        $response->assertStatus(200);
        $this->assertDatabaseHas('pull_requests', ['id' => $pr->id, 'status' => 'closed']);
    }

    public function test_cannot_close_merged_pr(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        ['site' => $site, 'main' => $main, 'feature' => $feature] = $this->setupSiteWithBranches($user);

        $pr = PullRequest::create(['site_id' => $site->id, 'source_branch_id' => $feature->id, 'target_branch_id' => $main->id, 'author_id' => $user->id, 'number' => 1, 'title' => 'PR', 'status' => 'merged', 'merged_at' => now(), 'merged_by' => $user->id]);

        $response = $this->postJson("/api/sites/{$site->id}/pulls/{$pr->id}/close");

        $response->assertStatus(400);
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

        $pr = PullRequest::create(['site_id' => $site->id, 'source_branch_id' => $feature->id, 'target_branch_id' => $main->id, 'author_id' => $user->id, 'number' => 1, 'title' => 'Add page', 'status' => 'open']);

        $response = $this->postJson("/api/sites/{$site->id}/pulls/{$pr->id}/merge");

        $response->assertStatus(200);
        $this->assertDatabaseHas('pull_requests', ['id' => $pr->id, 'status' => 'merged']);
        // Page should now exist in main branch
        $this->assertDatabaseHas('pages', ['site_id' => $site->id, 'branch_id' => $main->id, 'title' => 'New Feature Page']);
    }

    public function test_merge_blocked_when_conflicts_exist(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        ['site' => $site, 'main' => $main, 'feature' => $feature] = $this->setupSiteWithBranches($user);

        $logicalId = (string) Str::uuid();
        $baseContent = ['type' => 'doc', 'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'Base']]]]];
        $mainContent = ['type' => 'doc', 'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'Main changed']]]]];
        $featureContent = ['type' => 'doc', 'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'Feature changed']]]]];

        // Both branches modified the same page from a different base
        $mainPage    = $this->createPageOnBranch($site, $main, 'Home', $mainContent, $logicalId);
        $featurePage = $this->createPageOnBranch($site, $feature, 'Home', $featureContent, $logicalId);

        // Commit in feature branch with base = original content (not main's current)
        $this->createCommitForPage($site, $feature, $user, $featurePage, 'Feature edit', $baseContent);

        $pr = PullRequest::create(['site_id' => $site->id, 'source_branch_id' => $feature->id, 'target_branch_id' => $main->id, 'author_id' => $user->id, 'number' => 1, 'title' => 'Conflict PR', 'status' => 'open']);

        $response = $this->postJson("/api/sites/{$site->id}/pulls/{$pr->id}/merge");

        $response->assertStatus(422)
            ->assertJsonStructure(['message', 'conflicts']);
    }

    public function test_cannot_merge_closed_pr(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        ['site' => $site, 'main' => $main, 'feature' => $feature] = $this->setupSiteWithBranches($user);

        $pr = PullRequest::create(['site_id' => $site->id, 'source_branch_id' => $feature->id, 'target_branch_id' => $main->id, 'author_id' => $user->id, 'number' => 1, 'title' => 'PR', 'status' => 'closed']);

        $response = $this->postJson("/api/sites/{$site->id}/pulls/{$pr->id}/merge");

        $response->assertStatus(400);
    }

    // ─── Resolve ───────────────────────────────────────────────────────────────

    public function test_can_resolve_conflicts_and_then_merge(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        ['site' => $site, 'main' => $main, 'feature' => $feature] = $this->setupSiteWithBranches($user);

        $logicalId = (string) Str::uuid();
        $baseContent    = ['type' => 'doc', 'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'Base']]]]];
        $mainContent    = ['type' => 'doc', 'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'Main changed']]]]];
        $featureContent = ['type' => 'doc', 'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'Feature changed']]]]];
        $resolvedContent = ['type' => 'doc', 'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'Resolved']]]]];

        $mainPage    = $this->createPageOnBranch($site, $main, 'Home', $mainContent, $logicalId);
        $featurePage = $this->createPageOnBranch($site, $feature, 'Home', $featureContent, $logicalId);
        $this->createCommitForPage($site, $feature, $user, $featurePage, 'Feature edit', $baseContent);

        $pr = PullRequest::create(['site_id' => $site->id, 'source_branch_id' => $feature->id, 'target_branch_id' => $main->id, 'author_id' => $user->id, 'number' => 1, 'title' => 'Conflict PR', 'status' => 'open']);

        // Step 1: Resolve
        $resolveResponse = $this->postJson("/api/sites/{$site->id}/pulls/{$pr->id}/resolve", [
            'resolutions' => [[
                'logical_id' => $logicalId,
                'title'      => 'Home',
                'content'    => $resolvedContent,
            ]],
        ]);
        $resolveResponse->assertStatus(200);

        // Step 2: Merge should now succeed
        $mergeResponse = $this->postJson("/api/sites/{$site->id}/pulls/{$pr->id}/merge");
        $mergeResponse->assertStatus(200);
        $this->assertDatabaseHas('pull_requests', ['id' => $pr->id, 'status' => 'merged']);
    }

    // ─── Delete ────────────────────────────────────────────────────────────────

    public function test_author_can_delete_open_pr(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        ['site' => $site, 'main' => $main, 'feature' => $feature] = $this->setupSiteWithBranches($user);

        $pr = PullRequest::create(['site_id' => $site->id, 'source_branch_id' => $feature->id, 'target_branch_id' => $main->id, 'author_id' => $user->id, 'number' => 1, 'title' => 'PR', 'status' => 'open']);

        $response = $this->deleteJson("/api/sites/{$site->id}/pulls/{$pr->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('pull_requests', ['id' => $pr->id]);
    }

    public function test_cannot_delete_merged_pr(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        ['site' => $site, 'main' => $main, 'feature' => $feature] = $this->setupSiteWithBranches($user);

        $pr = PullRequest::create(['site_id' => $site->id, 'source_branch_id' => $feature->id, 'target_branch_id' => $main->id, 'author_id' => $user->id, 'number' => 1, 'title' => 'PR', 'status' => 'merged', 'merged_at' => now(), 'merged_by' => $user->id]);

        $response = $this->deleteJson("/api/sites/{$site->id}/pulls/{$pr->id}");

        $response->assertStatus(400);
    }

    // ─── Reviews ───────────────────────────────────────────────────────────────

    public function test_is_approved_when_all_reviewers_approved(): void
    {
        $user     = User::factory()->create();
        $reviewer = User::factory()->create();
        Sanctum::actingAs($user);
        ['site' => $site, 'main' => $main, 'feature' => $feature] = $this->setupSiteWithBranches($user);

        $pr = PullRequest::create(['site_id' => $site->id, 'source_branch_id' => $feature->id, 'target_branch_id' => $main->id, 'author_id' => $user->id, 'number' => 1, 'title' => 'PR', 'status' => 'open']);

        PullRequestReview::create(['pull_request_id' => $pr->id, 'user_id' => $reviewer->id, 'status' => 'approved', 'body' => 'LGTM']);

        $pr->load('reviews');
        $this->assertTrue($pr->isApproved());
        $this->assertFalse($pr->hasChangesRequested());
    }

    public function test_has_changes_requested_when_reviewer_requests_changes(): void
    {
        $user     = User::factory()->create();
        $reviewer = User::factory()->create();
        ['site' => $site, 'main' => $main, 'feature' => $feature] = $this->setupSiteWithBranches($user);

        $pr = PullRequest::create(['site_id' => $site->id, 'source_branch_id' => $feature->id, 'target_branch_id' => $main->id, 'author_id' => $user->id, 'number' => 1, 'title' => 'PR', 'status' => 'open']);

        PullRequestReview::create(['pull_request_id' => $pr->id, 'user_id' => $reviewer->id, 'status' => 'changes_requested', 'body' => 'Please fix X']);

        $pr->load('reviews');
        $this->assertFalse($pr->isApproved());
        $this->assertTrue($pr->hasChangesRequested());
    }
}
