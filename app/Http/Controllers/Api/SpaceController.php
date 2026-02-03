<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SpaceResource;
use App\Models\Space;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

class SpaceController extends Controller
{
    /**
     * List user's spaces (owned + member)
     */
    public function index(Request $request)
    {
        $userId = $request->user()->id;
        
        $spaces = Space::query()
            ->where('user_id', $userId)
            ->orWhereHas('members', function ($query) use ($userId) {
                $query->where('user_id', $userId)
                      ->where('status', 'accepted');
            })
            ->with(['owner:id,name,avatar_url'])
            ->withCount(['pages', 'members'])
            ->latest()
            ->get();

        return SpaceResource::collection($spaces);
    }

    /**
     * Create a new space
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'visibility' => 'in:public,private',
            'slug' => 'nullable|string|max:255|unique:spaces,slug',
        ]);

        $space = $request->user()->ownedSpaces()->create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'visibility' => $validated['visibility'] ?? 'private',
            'slug' => $validated['slug'] ?? Str::slug($validated['name']),
            'is_published' => false,
        ]);

        return new SpaceResource($space);
    }

    /**
     * Get space details
     */
    public function show(Request $request, Space $space)
    {
        if (!$space->canView($request->user())) {
            abort(403, 'You do not have access to this space.');
        }

        $space->load(['owner:id,name,avatar_url']);
        $space->loadCount(['members', 'pages']);
        
        return new SpaceResource($space);
    }

    /**
     * Update space
     */
    public function update(Request $request, Space $space)
    {
        if (!$space->canEdit($request->user())) {
            abort(403, 'You do not have permission to edit this space.');
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'visibility' => 'in:public,private',
            'slug' => 'nullable|string|max:255|unique:spaces,slug,' . $space->id,
        ]);

        $space->update($validated);

        return new SpaceResource($space);
    }

    /**
     * Delete space
     */
    public function destroy(Request $request, Space $space): JsonResponse
    {
        if ($space->user_id !== $request->user()->id) {
            abort(403, 'Only the owner can delete this space.');
        }

        $space->delete();

        return response()->json(['message' => 'Space deleted successfully.']);
    }

    /**
     * Publish space
     */
    public function publish(Request $request, Space $space)
    {
        if ($space->user_id !== $request->user()->id) {
            abort(403, 'Only the owner can publish this space.');
        }

        $space->update(['is_published' => true]);

        return (new SpaceResource($space))
            ->additional(['message' => 'Space published successfully.']);
    }

    /**
     * Unpublish space
     */
    public function unpublish(Request $request, Space $space)
    {
        if ($space->user_id !== $request->user()->id) {
            abort(403, 'Only the owner can unpublish this space.');
        }

        $space->update(['is_published' => false]);

        return (new SpaceResource($space))
            ->additional(['message' => 'Space unpublished successfully.']);
    }
}
