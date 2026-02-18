<?php

namespace Tests\Feature\Api;

use App\Models\Site;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SiteTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_list_their_sites(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        Site::factory()->count(3)->create(['user_id' => $user->id]);

        $response = $this->getJson('/api/sites');

        $response->assertStatus(200)
            ->assertJsonCount(3, 'data');
    }

    public function test_user_can_create_site(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/sites', [
            'name' => 'My Docs',
            'description' => 'Test description'
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'My Docs');

        // Check if site exists (slug is generated automatically by the backend)
        $this->assertDatabaseHas('sites', [
            'name' => 'My Docs', 
            'user_id' => $user->id
        ]);
    }

    public function test_user_can_view_own_site(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $site = Site::factory()->create(['user_id' => $user->id]);

        $response = $this->getJson("/api/sites/{$site->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.id', $site->id);
    }

    public function test_user_can_update_own_site(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $site = Site::factory()->create(['user_id' => $user->id]);

        $response = $this->putJson("/api/sites/{$site->id}", ['name' => 'Updated Name']);

        $response->assertStatus(200)
            ->assertJsonPath('data.name', 'Updated Name');
    }

    public function test_user_can_delete_own_site(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $site = Site::factory()->create(['user_id' => $user->id]);

        $response = $this->deleteJson("/api/sites/{$site->id}");

        $response->assertStatus(200);
        // Table uses SoftDeletes
        $this->assertSoftDeleted('sites', ['id' => $site->id]);
    }

    public function test_unauthenticated_user_cannot_list_sites(): void
    {
        $response = $this->getJson('/api/sites');
        $response->assertStatus(401);
    }
}
