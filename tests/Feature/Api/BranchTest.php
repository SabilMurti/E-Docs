<?php

namespace Tests\Feature\Api;

use App\Models\Branch;
use App\Models\Site;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BranchTest extends TestCase
{
    use RefreshDatabase;

    private function makeSite(User $user): Site
    {
        return Site::factory()->create(['user_id' => $user->id]);
    }

    public function test_can_list_branches(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $site = $this->makeSite($user);

        Branch::factory()->count(3)->create(['site_id' => $site->id]);

        $response = $this->getJson("/api/sites/{$site->id}/branches");

        $response->assertStatus(200)
            ->assertJsonCount(3, 'data');
    }

    public function test_can_create_branch(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $site = $this->makeSite($user);

        $response = $this->postJson("/api/sites/{$site->id}/branches", [
            'name' => 'feature-x',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'feature-x');

        $this->assertDatabaseHas('branches', ['site_id' => $site->id, 'name' => 'feature-x']);
    }

    public function test_branch_name_must_be_unique_per_site(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $site = $this->makeSite($user);

        Branch::factory()->create(['site_id' => $site->id, 'name' => 'main']);

        $response = $this->postJson("/api/sites/{$site->id}/branches", ['name' => 'main']);

        $response->assertStatus(422);
    }

    public function test_can_delete_non_default_branch(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $site   = $this->makeSite($user);
        $branch = Branch::factory()->create(['site_id' => $site->id, 'name' => 'feature', 'is_default' => false]);

        $response = $this->deleteJson("/api/sites/{$site->id}/branches/{$branch->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('branches', ['id' => $branch->id]);
    }

    public function test_cannot_delete_default_branch(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $site   = $this->makeSite($user);
        $branch = Branch::factory()->create(['site_id' => $site->id, 'name' => 'main', 'is_default' => true]);

        $response = $this->deleteJson("/api/sites/{$site->id}/branches/{$branch->id}");

        $response->assertStatus(400);
    }

    public function test_non_member_cannot_create_branch(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        Sanctum::actingAs($other);
        $site = $this->makeSite($owner);

        $response = $this->postJson("/api/sites/{$site->id}/branches", ['name' => 'hack']);

        $response->assertStatus(403);
    }
}
