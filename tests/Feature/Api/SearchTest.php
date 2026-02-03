<?php

namespace Tests\Feature\Api;

use App\Models\Page;
use App\Models\Space;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SearchTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_search_pages_by_title()
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $space = Space::factory()->create(['user_id' => $user->id]);
        
        Page::create([
            'space_id' => $space->id,
            'title' => 'Alpha Bravo',
            'slug' => 'alpha',
            'created_by' => $user->id
        ]);

        Page::create([
            'space_id' => $space->id,
            'title' => 'Charlie Delta',
            'slug' => 'charlie',
            'created_by' => $user->id
        ]);

        // Search for "Alpha"
        $response = $this->getJson("/api/spaces/{$space->id}/search?q=Alpha");

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data');
            
        $this->assertEquals('Alpha Bravo', $response->json('data.0.title'));
    }
}
