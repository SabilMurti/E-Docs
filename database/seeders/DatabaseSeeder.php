<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Commit;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Create Users
        $owner = User::factory()->create([
            'name' => 'Owner',
            'email' => 'owner@example.com', // Password is usually 'password'
        ]);
        
        $reza = User::factory()->create([
            'name' => 'Reza',
            'email' => 'reza@example.com',
        ]);
        
        $sabil = User::factory()->create([
            'name' => 'Sabil',
            'email' => 'sabil@example.com',
        ]);

        // 2. Create Site
        $site = \App\Models\Site::factory()->create([
            'user_id' => $owner->id,
            'name' => 'E-Docs Demo',
            'slug' => 'e-docs-demo',
        ]);

        // Add Members
        \App\Models\SiteMember::create(['site_id' => $site->id, 'user_id' => $reza->id, 'role' => 'write']);
        \App\Models\SiteMember::create(['site_id' => $site->id, 'user_id' => $sabil->id, 'role' => 'viewer']);

        // 3. Main Branch & Content
        $mainBranch = \App\Models\Branch::factory()->create([
            'site_id' => $site->id,
            'name' => 'main',
            'is_default' => true,
        ]);

        // Create Page: "Home"
        $logicalId = (string) \Illuminate\Support\Str::uuid();
        $page = \App\Models\Page::factory()->create([
            'site_id' => $site->id,
            'branch_id' => $mainBranch->id,
            'title' => 'Home',
            'slug' => 'home',
            'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'Welcome to E-Docs']]]],
            'logical_id' => $logicalId,
        ]);
        
        // Initial Commit
        $commit1 = \App\Models\Commit::factory()->create([
            'site_id' => $site->id,
            'branch_id' => $mainBranch->id,
            'user_id' => $owner->id,
            'message' => 'Initial Commit',
        ]);
        
        \App\Models\CommitPage::create([
            'commit_id' => $commit1->id,
            'page_id' => $page->id,
            'action' => 'created',
            'title' => $page->title,
            'content' => $page->content,
        ]);

        // 4. Scenario: Reza updates Main -> "Tes"
        $page->update([
            'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'Tes']]]]
        ]);
        
        $commit2 = \App\Models\Commit::factory()->create([
            'site_id' => $site->id,
            'branch_id' => $mainBranch->id,
            'user_id' => $owner->id,
            'message' => 'Update Main to Tes',
        ]);

        \App\Models\CommitPage::create([
            'commit_id' => $commit2->id,
            'page_id' => $page->id, // Re-use page ID or typically new revision? Model keeps same ID. 
            'action' => 'modified',
            'title' => $page->title,
            'content' => $page->content,
            'previous_content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'Welcome to E-Docs']]]],
        ]);

        // 5. Scenario: Reza Branch (Outdated) -> "Tos"
        $rezaBranch = \App\Models\Branch::factory()->create([
            'site_id' => $site->id,
            'name' => 'reza-feature',
            'parent_branch_id' => $mainBranch->id,
        ]);
        
        $rezaPage = $page->replicate();
        $rezaPage->branch_id = $rezaBranch->id;
        $rezaPage->content = [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'Tos']]]];
        $rezaPage->save();
        
        $commit3 = \App\Models\Commit::factory()->create([
            'site_id' => $site->id,
            'branch_id' => $rezaBranch->id,
            'user_id' => $reza->id,
            'message' => 'Reza Update to Tos',
        ]);

        \App\Models\CommitPage::create([
            'commit_id' => $commit3->id,
            'page_id' => $rezaPage->id,
            'action' => 'modified',
            'title' => $rezaPage->title,
            'content' => $rezaPage->content,
            'previous_content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'Welcome to E-Docs']]]],
        ]);

        // Create Conflict PR
        \App\Models\PullRequest::create([
            'site_id' => $site->id,
            'source_branch_id' => $rezaBranch->id,
            'target_branch_id' => $mainBranch->id,
            'author_id' => $reza->id,
            'number' => 1,
            'title' => 'Reza Feature (Conflict)',
            'description' => 'This should conflict with Main',
        ]);
    }
}
