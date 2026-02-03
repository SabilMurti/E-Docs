<?php

namespace Tests\Feature\Api;

use App\Models\Space;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SpaceTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_list_their_spaces(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        Space::factory()->count(3)->create(['user_id' => $user->id]);

        $response = $this->getJson('/api/spaces');

        $response->assertStatus(200);
        $response->assertJsonCount(3, 'data');
    }

    public function test_user_can_create_space(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/spaces', [
            'name' => 'My Documentation',
            'visibility' => 'public',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'My Documentation')
            ->assertJsonPath('data.slug', 'my-documentation');
        
        $this->assertDatabaseHas('spaces', [
            'name' => 'My Documentation',
            'user_id' => $user->id,
        ]);
    }

    public function test_user_can_view_own_space(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $space = Space::factory()->create(['user_id' => $user->id]);

        $response = $this->getJson("/api/spaces/{$space->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.id', $space->id);
    }

    public function test_user_can_update_own_space(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $space = Space::factory()->create(['user_id' => $user->id, 'name' => 'Old Name']);

        $response = $this->putJson("/api/spaces/{$space->id}", [
            'name' => 'New Name',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.name', 'New Name');
            
        $this->assertDatabaseHas('spaces', ['name' => 'New Name']);
    }

    public function test_user_can_delete_own_space(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $space = Space::factory()->create(['user_id' => $user->id]);

        $response = $this->deleteJson("/api/spaces/{$space->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('spaces', ['id' => $space->id]);
    }

    public function test_user_cannot_access_others_private_space(): void
    {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();
        Sanctum::actingAs($otherUser);

        $space = Space::factory()->create(['user_id' => $owner->id, 'visibility' => 'private']);

        $response = $this->getJson("/api/spaces/{$space->id}");

        $response->assertStatus(403);
    }
}
