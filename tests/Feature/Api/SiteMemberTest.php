<?php

namespace Tests\Feature\Api;

use App\Models\Branch;
use App\Models\Site;
use App\Models\SiteMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SiteMemberTest extends TestCase
{
    use RefreshDatabase;

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private function makeSite(User $owner): Site
    {
        return Site::factory()->create(['user_id' => $owner->id]);
    }

    private function addMember(Site $site, User $user, string $role): void
    {
        SiteMember::create([
            'site_id' => $site->id,
            'user_id' => $user->id,
            'role'    => $role,
        ]);
    }

    // ─── List Members ─────────────────────────────────────────────────────────

    public function test_owner_can_list_members(): void
    {
        $owner  = User::factory()->create();
        $member = User::factory()->create();
        Sanctum::actingAs($owner);

        $site = $this->makeSite($owner);
        $this->addMember($site, $member, 'write');

        $response = $this->getJson("/api/sites/{$site->id}/members");

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }

    public function test_member_can_list_members(): void
    {
        $owner  = User::factory()->create();
        $member = User::factory()->create();
        Sanctum::actingAs($member);

        $site = $this->makeSite($owner);
        $this->addMember($site, $member, 'read');

        $response = $this->getJson("/api/sites/{$site->id}/members");

        $response->assertStatus(200);
    }

    public function test_non_member_cannot_list_members(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        Sanctum::actingAs($other);

        $site = $this->makeSite($owner);

        $this->getJson("/api/sites/{$site->id}/members")->assertStatus(403);
    }

    // ─── Add Member ───────────────────────────────────────────────────────────

    public function test_owner_can_add_member(): void
    {
        $owner  = User::factory()->create();
        $newbie = User::factory()->create();
        Sanctum::actingAs($owner);

        $site = $this->makeSite($owner);

        $response = $this->postJson("/api/sites/{$site->id}/members", [
            'email' => $newbie->email,
            'role'  => 'write',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.email', $newbie->email)
            ->assertJsonPath('data.role', 'write');

        $this->assertDatabaseHas('site_members', [
            'site_id' => $site->id,
            'user_id' => $newbie->id,
            'role'    => 'write',
        ]);
    }

    public function test_admin_member_can_add_member(): void
    {
        $owner = User::factory()->create();
        $admin = User::factory()->create();
        $newbie = User::factory()->create();
        Sanctum::actingAs($admin);

        $site = $this->makeSite($owner);
        $this->addMember($site, $admin, 'admin');

        $response = $this->postJson("/api/sites/{$site->id}/members", [
            'email' => $newbie->email,
            'role'  => 'read',
        ]);

        $response->assertStatus(200);
    }

    public function test_write_member_cannot_add_member(): void
    {
        $owner  = User::factory()->create();
        $writer = User::factory()->create();
        $newbie = User::factory()->create();
        Sanctum::actingAs($writer);

        $site = $this->makeSite($owner);
        $this->addMember($site, $writer, 'write');

        $response = $this->postJson("/api/sites/{$site->id}/members", [
            'email' => $newbie->email,
            'role'  => 'read',
        ]);

        $response->assertStatus(403);
    }

    public function test_cannot_add_nonexistent_user(): void
    {
        $owner = User::factory()->create();
        Sanctum::actingAs($owner);

        $site = $this->makeSite($owner);

        $response = $this->postJson("/api/sites/{$site->id}/members", [
            'email' => 'ghost@nowhere.com',
            'role'  => 'read',
        ]);

        $response->assertStatus(404);
    }

    public function test_cannot_add_already_existing_member(): void
    {
        $owner  = User::factory()->create();
        $member = User::factory()->create();
        Sanctum::actingAs($owner);

        $site = $this->makeSite($owner);
        $this->addMember($site, $member, 'read');

        $response = $this->postJson("/api/sites/{$site->id}/members", [
            'email' => $member->email,
            'role'  => 'write',
        ]);

        $response->assertStatus(400);
    }

    public function test_cannot_add_owner_as_member(): void
    {
        $owner = User::factory()->create();
        Sanctum::actingAs($owner);

        $site = $this->makeSite($owner);

        $response = $this->postJson("/api/sites/{$site->id}/members", [
            'email' => $owner->email,
            'role'  => 'admin',
        ]);

        $response->assertStatus(400);
    }

    public function test_role_must_be_valid(): void
    {
        $owner  = User::factory()->create();
        $newbie = User::factory()->create();
        Sanctum::actingAs($owner);

        $site = $this->makeSite($owner);

        $response = $this->postJson("/api/sites/{$site->id}/members", [
            'email' => $newbie->email,
            'role'  => 'superadmin', // invalid
        ]);

        $response->assertStatus(422);
    }

    // ─── Update Role ──────────────────────────────────────────────────────────

    public function test_owner_can_update_member_role(): void
    {
        $owner  = User::factory()->create();
        $member = User::factory()->create();
        Sanctum::actingAs($owner);

        $site = $this->makeSite($owner);
        $this->addMember($site, $member, 'read');

        $response = $this->putJson("/api/sites/{$site->id}/members/{$member->id}", [
            'role' => 'maintain',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.role', 'maintain');

        $this->assertDatabaseHas('site_members', [
            'site_id' => $site->id,
            'user_id' => $member->id,
            'role'    => 'maintain',
        ]);
    }

    public function test_non_admin_cannot_update_role(): void
    {
        $owner  = User::factory()->create();
        $writer = User::factory()->create();
        $target = User::factory()->create();
        Sanctum::actingAs($writer);

        $site = $this->makeSite($owner);
        $this->addMember($site, $writer, 'write');
        $this->addMember($site, $target, 'read');

        $response = $this->putJson("/api/sites/{$site->id}/members/{$target->id}", [
            'role' => 'admin',
        ]);

        $response->assertStatus(403);
    }

    public function test_cannot_change_owner_role(): void
    {
        $owner = User::factory()->create();
        Sanctum::actingAs($owner);

        $site = $this->makeSite($owner);

        $response = $this->putJson("/api/sites/{$site->id}/members/{$owner->id}", [
            'role' => 'read',
        ]);

        $response->assertStatus(400);
    }

    // ─── Remove Member ────────────────────────────────────────────────────────

    public function test_owner_can_remove_member(): void
    {
        $owner  = User::factory()->create();
        $member = User::factory()->create();
        Sanctum::actingAs($owner);

        $site = $this->makeSite($owner);
        $this->addMember($site, $member, 'write');

        $response = $this->deleteJson("/api/sites/{$site->id}/members/{$member->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('site_members', [
            'site_id' => $site->id,
            'user_id' => $member->id,
        ]);
    }

    public function test_admin_can_remove_member(): void
    {
        $owner  = User::factory()->create();
        $admin  = User::factory()->create();
        $member = User::factory()->create();
        Sanctum::actingAs($admin);

        $site = $this->makeSite($owner);
        $this->addMember($site, $admin, 'admin');
        $this->addMember($site, $member, 'read');

        $this->deleteJson("/api/sites/{$site->id}/members/{$member->id}")->assertStatus(200);
    }

    public function test_cannot_remove_site_owner(): void
    {
        $owner = User::factory()->create();
        Sanctum::actingAs($owner);

        $site = $this->makeSite($owner);

        $response = $this->deleteJson("/api/sites/{$site->id}/members/{$owner->id}");

        $response->assertStatus(400);
    }

    public function test_write_member_cannot_remove_others(): void
    {
        $owner  = User::factory()->create();
        $writer = User::factory()->create();
        $target = User::factory()->create();
        Sanctum::actingAs($writer);

        $site = $this->makeSite($owner);
        $this->addMember($site, $writer, 'write');
        $this->addMember($site, $target, 'read');

        $this->deleteJson("/api/sites/{$site->id}/members/{$target->id}")->assertStatus(403);
    }

    // ─── Role Hierarchy ───────────────────────────────────────────────────────

    public function test_all_valid_roles_can_be_assigned(): void
    {
        $owner = User::factory()->create();
        Sanctum::actingAs($owner);

        $site = $this->makeSite($owner);

        foreach (['admin', 'maintain', 'write', 'read'] as $role) {
            $user = User::factory()->create();

            $response = $this->postJson("/api/sites/{$site->id}/members", [
                'email' => $user->email,
                'role'  => $role,
            ]);

            $response->assertStatus(200, "Failed for role: {$role}");
        }
    }
}
