<?php

namespace Tests\Feature\Api;

use App\Models\Page;
use App\Models\Space;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PageTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_root_page()
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $space = Space::factory()->create(['user_id' => $user->id]);

        $response = $this->postJson("/api/spaces/{$space->id}/pages", [
            'title' => 'Home Page',
            'content' => ['type' => 'doc', 'content' => []]
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.title', 'Home Page')
            ->assertJsonPath('data.slug', 'home-page');

        $this->assertDatabaseHas('pages', ['title' => 'Home Page', 'parent_id' => null]);
    }

    public function test_can_create_child_page()
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $space = Space::factory()->create(['user_id' => $user->id]);
        $parent = Page::create([
            'space_id' => $space->id,
            'title' => 'Parent',
            'slug' => 'parent',
            'created_by' => $user->id
        ]);

        $response = $this->postJson("/api/spaces/{$space->id}/pages", [
            'title' => 'Child Page',
            'parent_id' => $parent->id
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.parent_id', $parent->id);
    }

    public function test_can_list_pages_tree()
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $space = Space::factory()->create(['user_id' => $user->id]);
        
        $parent = Page::create([
            'space_id' => $space->id,
            'title' => 'Parent',
            'slug' => 'parent',
            'order' => 1,
            'created_by' => $user->id
        ]);

        $child = Page::create([
            'space_id' => $space->id,
            'title' => 'Child',
            'slug' => 'child',
            'parent_id' => $parent->id,
            'created_by' => $user->id
        ]);

        $response = $this->getJson("/api/spaces/{$space->id}/pages");

        $response->assertStatus(200)
            ->assertJsonCount(1); // One root page
            
        // Assert structure
        $data = $response->json('data');
        $this->assertEquals('Parent', $data[0]['title']);
        $this->assertEquals('Child', $data[0]['children'][0]['title']);
    }

    public function test_can_reorder_pages()
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $space = Space::factory()->create(['user_id' => $user->id]);
        
        $page1 = Page::create(['space_id' => $space->id, 'title' => 'P1', 'slug' => 'p1', 'order' => 1, 'created_by' => $user->id]);
        $page2 = Page::create(['space_id' => $space->id, 'title' => 'P2', 'slug' => 'p2', 'order' => 2, 'created_by' => $user->id]);

        $response = $this->postJson("/api/spaces/{$space->id}/pages/reorder", [
            'pages' => [
                ['id' => $page2->id, 'order' => 1, 'parent_id' => null],
                ['id' => $page1->id, 'order' => 2, 'parent_id' => null],
            ]
        ]);

        $response->assertStatus(200);

        $this->assertEquals(1, $page2->fresh()->order);
        $this->assertEquals(2, $page1->fresh()->order);
    }
}
