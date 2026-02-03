<?php

namespace Tests\Feature\Api;

use App\Models\Page;
use App\Models\Space;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PageRevisionTest extends TestCase
{
    use RefreshDatabase;

    public function test_updating_page_creates_revision()
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $space = Space::factory()->create(['user_id' => $user->id]);
        
        $page = Page::create([
            'space_id' => $space->id,
            'title' => 'Original Title',
            'slug' => 'original',
            'content' => ['text' => 'Original Content'], // Ensure this matches what creates a revision
            'created_by' => $user->id,
            'updated_by' => $user->id,
            // updated_at will handle timestamps
        ]);
        
        // Ensure initial state doesn't have revision unless we updated it. 
        // My Model logic creates revision ON UPDATE of existing content.
        // Let's update it.
        
        // Need to sleep or force timestamp if revisions rely on it? 
        // Model logic: static::updating -> if isDirty -> create revision
        
        $this->putJson("/api/spaces/{$space->id}/pages/{$page->id}", [
            'title' => 'New Title',
            'content' => ['text' => 'New Content']
        ]);

        $this->assertDatabaseHas('page_revisions', [
            'page_id' => $page->id,
            'title' => 'Original Title', // Should store the OLD title
        ]);
        
        $this->assertDatabaseHas('pages', [
            'id' => $page->id,
            'title' => 'New Title'
        ]);
    }

    public function test_can_restore_revision()
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $space = Space::factory()->create(['user_id' => $user->id]);
        
        $page = Page::create([
            'space_id' => $space->id,
            'title' => 'Current Title',
            'slug' => 'page',
            'content' => ['text' => 'Current'],
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);

        $revision = $page->revisions()->create([
            'user_id' => $user->id,
            'title' => 'Old Title',
            'content' => ['text' => 'Old'],
            'revision_number' => 1,
            'change_summary' => 'test'
        ]);

        $response = $this->postJson("/api/spaces/{$space->id}/pages/{$page->id}/revisions/{$revision->id}/restore");

        $response->assertStatus(200);

        $this->assertEquals('Old Title', $page->fresh()->title);
    }
}
