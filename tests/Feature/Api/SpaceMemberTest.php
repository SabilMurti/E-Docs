<?php

namespace Tests\Feature\Api;

use App\Models\Space;
use App\Models\SpaceMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SpaceMemberTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_invite_member()
    {
        $owner = User::factory()->create();
        Sanctum::actingAs($owner);
        $space = Space::factory()->create(['user_id' => $owner->id]);

        $response = $this->postJson("/api/spaces/{$space->id}/members", [
            'email' => 'invitee@example.com',
            'role' => 'editor'
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.email', 'invitee@example.com')
            ->assertJsonPath('data.status', 'pending');
            
        $this->assertDatabaseHas('space_members', [
            'space_id' => $space->id,
            'email' => 'invitee@example.com',
            'status' => 'pending'
        ]);
    }

    public function test_user_can_accept_invite()
    {
        $owner = User::factory()->create();
        $space = Space::factory()->create(['user_id' => $owner->id]);
        
        $invitee = User::factory()->create(['email' => 'invitee@example.com']);
        
        $member = SpaceMember::create([
            'space_id' => $space->id,
            'user_id' => $invitee->id,
            'email' => 'invitee@example.com',
            'role' => 'editor',
            'status' => 'pending',
            'invite_token' => 'test-token'
        ]);

        Sanctum::actingAs($invitee);

        $response = $this->postJson("/api/spaces/{$space->id}/invites/test-token/accept");

        $response->assertStatus(200);
        
        $this->assertDatabaseHas('space_members', [
            'id' => $member->id,
            'status' => 'accepted',
            'user_id' => $invitee->id
        ]);
    }
}
