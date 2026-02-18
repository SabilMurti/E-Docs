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

    public function test_can_list_commits_for_site(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        ['site' => $site, 'branch' => $branch] = $this->makeSetup($user);

        Commit::factory()->count(3)->create(['site_id' => $site->id, 'branch_id' => $branch->id, 'user_id' => $user->id]);

        $response = $this->getJson("/api/sites/{$site->id}/commits?branch_id={$branch->id}");

        $response->assertStatus(200)
            ->assertJsonCount(3, 'data');
    }

    public function test_can_create_commit_for_page(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        ['site' => $site, 'branch' => $branch, 'page' => $page] = $this->makeSetup($user);

        $response = $this->postJson("/api/sites/{$site->id}/pages/{$page->id}/commits", [
            'branch_id' => $branch->id,
            'message'   => 'Initial commit',
            'content'   => ['type' => 'doc', 'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'Hello']]]]],
            'title'     => 'Home',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.message', 'Initial commit');

        $this->assertDatabaseHas('commits', ['site_id' => $site->id, 'message' => 'Initial commit']);
    }

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

    public function test_commit_message_is_required(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        ['site' => $site, 'branch' => $branch, 'page' => $page] = $this->makeSetup($user);

        $response = $this->postJson("/api/sites/{$site->id}/pages/{$page->id}/commits", [
            'branch_id' => $branch->id,
            'content'   => ['type' => 'doc', 'content' => []],
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['message']);
    }
}
