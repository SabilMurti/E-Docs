<?php

namespace Tests\Feature\Api;

use App\Models\Branch;
use App\Models\Commit;
use App\Models\CommitPage;
use App\Models\Page;
use App\Models\PullRequest;
use App\Models\Site;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Full GitHub-like collaboration workflow tests.
 *
 * Simulates real-world scenarios:
 * 1. Owner creates site → invites collaborator
 * 2. Collaborator creates branch → edits page → commits
 * 3. Collaborator opens PR → reviewer approves → owner merges
 * 4. Conflict scenario: two users edit same page → resolve → merge
 */
class CollaborationFlowTest extends TestCase
{
    use RefreshDatabase;

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private function createPage(Site $site, Branch $branch, string $title, array $content = [], ?string $logicalId = null): Page
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

    private function commitPage(Site $site, Branch $branch, User $user, Page $page, string $message, ?array $prevContent = null, ?string $prevTitle = null): Commit
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
            'previous_content' => $prevContent ?? $page->content,
            'previous_title'   => $prevTitle ?? $page->title,
        ]);

        return $commit;
    }

    // ─── Scenario 1: Happy Path ────────────────────────────────────────────────

    /**
     * Full happy-path flow:
     * Owner creates site → adds collaborator → collaborator creates branch
     * → commits change → opens PR → reviewer approves → owner merges
     */
    public function test_full_happy_path_collaboration_flow(): void
    {
        // 1. Owner creates site
        $owner = User::factory()->create(['name' => 'Alice Owner']);
        Sanctum::actingAs($owner);

        $siteResponse = $this->postJson('/api/sites', [
            'name'        => 'My Documentation',
            'description' => 'Team docs',
        ]);
        $siteResponse->assertStatus(201);
        $siteId = $siteResponse->json('data.id');
        $site   = Site::find($siteId);

        // 2. Retrieve auto-created 'main' branch (SiteController::store() creates it automatically)
        $main = Branch::where('site_id', $siteId)->where('name', 'main')->first();
        $this->assertNotNull($main, 'Main branch should be auto-created by SiteController');

        // 3. Create initial page on main
        $logicalId   = (string) Str::uuid();
        $baseContent = ['type' => 'doc', 'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'Welcome to docs']]]]];
        $mainPage    = $this->createPage($site, $main, 'Welcome', $baseContent, $logicalId);

        // 4. Invite collaborator
        $collaborator = User::factory()->create(['name' => 'Bob Collaborator']);
        $this->postJson("/api/sites/{$siteId}/members", [
            'email' => $collaborator->email,
            'role'  => 'write',
        ])->assertStatus(200);

        // 5. Collaborator creates feature branch
        Sanctum::actingAs($collaborator);
        $branchResponse = $this->postJson("/api/sites/{$siteId}/branches", [
            'name'          => 'feature/update-welcome',
            'source_branch' => 'main',
        ]);
        $branchResponse->assertStatus(201);
        $featureBranchId = $branchResponse->json('data.id');
        $featureBranch   = Branch::find($featureBranchId);

        // 6. Collaborator edits the cloned page on feature branch
        $featurePage = Page::where('branch_id', $featureBranchId)
            ->where('logical_id', $logicalId)
            ->first();

        $this->assertNotNull($featurePage, 'Page should be cloned to feature branch');

        // 7. Collaborator commits the change via API.
        // IMPORTANT: Do NOT manually update featurePage.content before committing.
        // The commit API will capture current content as previous_content and update to new content.
        // This ensures previous_content = baseContent (current state), not the new content.
        $updatedContent = ['type' => 'doc', 'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'Welcome to our amazing docs!']]]]];
        $commitResponse = $this->postJson("/api/sites/{$siteId}/pages/{$featurePage->id}/commits", [
            'message' => 'Update welcome page with better copy',
            'content' => $updatedContent,
            'title'   => 'Welcome Updated',
        ]);
        $commitResponse->assertStatus(201);

        // 8. Collaborator opens a PR
        $prResponse = $this->postJson("/api/sites/{$siteId}/pulls", [
            'source_branch_id' => $featureBranchId,
            'target_branch_id' => $main->id,
            'title'            => 'Update welcome page',
            'description'      => 'Improved the welcome copy',
        ]);
        $prResponse->assertStatus(201);
        $prId = $prResponse->json('data.id');

        // 9. Owner reviews and approves
        Sanctum::actingAs($owner);
        $reviewResponse = $this->postJson("/api/sites/{$siteId}/pulls/{$prId}/reviews", [
            'status' => 'approved',
            'body'   => 'Great improvement!',
        ]);
        $reviewResponse->assertStatus(201);

        // 10. Owner merges the PR
        $mergeResponse = $this->postJson("/api/sites/{$siteId}/pulls/{$prId}/merge");
        $mergeResponse->assertStatus(200);

        // 11. Verify main branch has updated content
        $mainPage->refresh();
        $this->assertEquals('Welcome Updated', $mainPage->title);
        $this->assertEquals($updatedContent, $mainPage->content);

        // 12. Verify PR is marked as merged
        $this->assertDatabaseHas('pull_requests', ['id' => $prId, 'status' => 'merged']);
    }

    // ─── Scenario 2: Conflict Resolution ──────────────────────────────────────

    /**
     * Conflict scenario:
     * Both owner and collaborator edit the same page on different branches
     * → PR shows conflict → resolve → merge succeeds
     */
    public function test_conflict_resolution_workflow(): void
    {
        $owner        = User::factory()->create();
        $collaborator = User::factory()->create();

        // Setup
        $site = Site::factory()->create(['user_id' => $owner->id]);
        $main = Branch::factory()->create(['site_id' => $site->id, 'name' => 'main', 'is_default' => true]);
        $site->members()->attach($collaborator->id, ['role' => 'maintain']);

        $logicalId   = (string) Str::uuid();
        $baseContent = ['type' => 'doc', 'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'Original']]]]];

        // Both branches have the same page
        $mainPage    = $this->createPage($site, $main, 'Shared Page', $baseContent, $logicalId);

        // Feature branch with different content
        $feature = Branch::factory()->create(['site_id' => $site->id, 'name' => 'feature/edit']);
        $featureContent = ['type' => 'doc', 'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'Feature edit']]]]];
        $featurePage = $this->createPage($site, $feature, 'Shared Page', $featureContent, $logicalId);

        // Main branch also changed (simulating concurrent edit)
        $mainContent = ['type' => 'doc', 'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'Main edit']]]]];
        $mainPage->update(['content' => $mainContent]);

        // Commit feature change with base = original (not main's current)
        $this->commitPage($site, $feature, $collaborator, $featurePage, 'Feature edit', $baseContent);

        // Open PR
        $pr = PullRequest::create([
            'site_id'          => $site->id,
            'source_branch_id' => $feature->id,
            'target_branch_id' => $main->id,
            'author_id'        => $collaborator->id,
            'number'           => 1,
            'title'            => 'Feature edit',
            'status'           => 'open',
        ]);

        // Attempt merge - should fail with conflict
        Sanctum::actingAs($owner);
        $this->postJson("/api/sites/{$site->id}/pulls/{$pr->id}/merge")
            ->assertStatus(422)
            ->assertJsonStructure(['message', 'conflicts']);

        // Resolve conflict
        $resolvedContent = ['type' => 'doc', 'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'Merged: Feature + Main']]]]];
        $this->postJson("/api/sites/{$site->id}/pulls/{$pr->id}/resolve", [
            'resolutions' => [[
                'logical_id' => $logicalId,
                'title'      => 'Shared Page',
                'content'    => $resolvedContent,
            ]],
        ])->assertStatus(200);

        // Merge should now succeed
        $this->postJson("/api/sites/{$site->id}/pulls/{$pr->id}/merge")
            ->assertStatus(200);

        // Main page should have resolved content
        $mainPage->refresh();
        $this->assertEquals($resolvedContent, $mainPage->content);
    }

    // ─── Scenario 3: Branch Lifecycle ─────────────────────────────────────────

    /**
     * Branch lifecycle:
     * Create branch → add pages → commit → open PR → merge → delete branch
     */
    public function test_branch_lifecycle_create_to_delete(): void
    {
        $owner = User::factory()->create();
        Sanctum::actingAs($owner);

        $site = Site::factory()->create(['user_id' => $owner->id]);
        $main = Branch::factory()->create(['site_id' => $site->id, 'name' => 'main', 'is_default' => true]);

        // Create feature branch
        $branchResponse = $this->postJson("/api/sites/{$site->id}/branches", [
            'name'          => 'feature/new-section',
            'source_branch' => 'main',
        ]);
        $branchResponse->assertStatus(201);
        $featureBranchId = $branchResponse->json('data.id');
        $featureBranch   = Branch::find($featureBranchId);

        // Add a new page to feature branch
        $newPage = $this->createPage($site, $featureBranch, 'New Section');
        $this->commitPage($site, $featureBranch, $owner, $newPage, 'Add new section');

        // Open PR
        $pr = PullRequest::create([
            'site_id'          => $site->id,
            'source_branch_id' => $featureBranchId,
            'target_branch_id' => $main->id,
            'author_id'        => $owner->id,
            'number'           => 1,
            'title'            => 'Add new section',
            'status'           => 'open',
        ]);

        // Merge PR
        $this->postJson("/api/sites/{$site->id}/pulls/{$pr->id}/merge")->assertStatus(200);

        // Verify page is on main
        $this->assertDatabaseHas('pages', ['branch_id' => $main->id, 'title' => 'New Section']);

        // Delete feature branch (cleanup after merge)
        $this->deleteJson("/api/sites/{$site->id}/branches/{$featureBranchId}")->assertStatus(200);
        $this->assertSoftDeleted('branches', ['id' => $featureBranchId]);
    }

    // ─── Scenario 4: Commit History ───────────────────────────────────────────

    /**
     * Commit history:
     * Multiple commits on a branch → list shows all in order
     */
    public function test_commit_history_tracks_all_changes(): void
    {
        $owner = User::factory()->create();
        Sanctum::actingAs($owner);

        $site   = Site::factory()->create(['user_id' => $owner->id]);
        $branch = Branch::factory()->create(['site_id' => $site->id, 'name' => 'main', 'is_default' => true]);
        $page   = $this->createPage($site, $branch, 'Home');

        // Make 3 commits
        $messages = ['First edit', 'Second edit', 'Third edit'];
        foreach ($messages as $msg) {
            $this->postJson("/api/sites/{$site->id}/pages/{$page->id}/commits", [
                'message' => $msg,
                'content' => ['type' => 'doc', 'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => $msg]]]]],
            ])->assertStatus(201);
        }

        // List commits
        $response = $this->getJson("/api/sites/{$site->id}/commits?branch_id={$branch->id}");
        $response->assertStatus(200)
            ->assertJsonCount(3, 'data');
    }

    // ─── Scenario 5: Multi-Page PR ────────────────────────────────────────────

    /**
     * PR with multiple page changes (added, modified, deleted)
     */
    public function test_pr_with_multiple_page_changes(): void
    {
        $owner = User::factory()->create();
        Sanctum::actingAs($owner);

        $site    = Site::factory()->create(['user_id' => $owner->id]);
        $main    = Branch::factory()->create(['site_id' => $site->id, 'name' => 'main', 'is_default' => true]);
        $feature = Branch::factory()->create(['site_id' => $site->id, 'name' => 'feature/multi']);

        // Page 1: exists on both (will be modified)
        $logicalId1   = (string) Str::uuid();
        $baseContent1 = ['type' => 'doc', 'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'Page 1 original']]]]];
        $newContent1  = ['type' => 'doc', 'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'Page 1 updated']]]]];

        $this->createPage($site, $main, 'Page 1', $baseContent1, $logicalId1);
        $featurePage1 = $this->createPage($site, $feature, 'Page 1 Updated', $newContent1, $logicalId1);
        // Pass prevTitle='Page 1' (the base title on main) to avoid false conflict detection
        $this->commitPage($site, $feature, $owner, $featurePage1, 'Update page 1', $baseContent1, 'Page 1');

        // Page 2: only in feature (will be added)
        $newPage = $this->createPage($site, $feature, 'Brand New Page');
        $this->commitPage($site, $feature, $owner, $newPage, 'Add brand new page');

        // Open PR
        $pr = PullRequest::create([
            'site_id'          => $site->id,
            'source_branch_id' => $feature->id,
            'target_branch_id' => $main->id,
            'author_id'        => $owner->id,
            'number'           => 1,
            'title'            => 'Multi-page changes',
            'status'           => 'open',
        ]);

        // Check PR diff shows both changes
        $response = $this->getJson("/api/sites/{$site->id}/pulls/{$pr->id}");
        $response->assertStatus(200);

        $changes = $response->json('changes');
        $this->assertCount(2, $changes);

        $types = collect($changes)->pluck('type')->sort()->values()->toArray();
        $this->assertEquals(['added', 'modified'], $types);

        // Merge
        $this->postJson("/api/sites/{$site->id}/pulls/{$pr->id}/merge")->assertStatus(200);

        // Verify both changes applied to main
        $this->assertDatabaseHas('pages', ['branch_id' => $main->id, 'title' => 'Page 1 Updated']);
        $this->assertDatabaseHas('pages', ['branch_id' => $main->id, 'title' => 'Brand New Page']);
    }

    // ─── Scenario 6: Permission Boundaries ────────────────────────────────────

    /**
     * Verify role-based access control throughout the workflow
     */
    public function test_read_only_member_cannot_modify_anything(): void
    {
        $owner  = User::factory()->create();
        $reader = User::factory()->create();

        $site = Site::factory()->create(['user_id' => $owner->id]);
        $main = Branch::factory()->create(['site_id' => $site->id, 'name' => 'main', 'is_default' => true]);
        $site->members()->attach($reader->id, ['role' => 'read']);

        Sanctum::actingAs($reader);

        // Cannot create branch
        $this->postJson("/api/sites/{$site->id}/branches", [
            'name'          => 'reader-branch',
            'source_branch' => 'main',
        ])->assertStatus(403);

        // Cannot create page
        $this->postJson("/api/sites/{$site->id}/pages", [
            'branch_id' => $main->id,
            'title'     => 'Unauthorized Page',
            'slug'      => 'unauthorized',
        ])->assertStatus(403);

        // Cannot create PR
        $feature = Branch::factory()->create(['site_id' => $site->id, 'name' => 'feature']);
        $this->postJson("/api/sites/{$site->id}/pulls", [
            'source_branch_id' => $feature->id,
            'target_branch_id' => $main->id,
            'title'            => 'Unauthorized PR',
        ])->assertStatus(403);

        // CAN list branches (read access)
        $this->getJson("/api/sites/{$site->id}/branches")->assertStatus(200);

        // CAN list PRs (read access)
        $this->getJson("/api/sites/{$site->id}/pulls")->assertStatus(200);
    }
}
