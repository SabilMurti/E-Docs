<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PageResource;
use App\Models\Page;
use App\Models\Space;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class PageController extends Controller
{
    /**
     * List pages (tree structure)
     */
    public function index(Request $request, Space $space)
    {
        if (!$space->canView($request->user())) {
            abort(403);
        }

        $pages = $space->rootPages()
            ->with(['children' => function($query) {
                // Ensure recursive loading works by relying on lazy loading depth limit or recursive resource
            }])
            ->get();

        // PageResource handles recursive children transformation
        return PageResource::collection($pages);
    }

    /**
     * Create new page
     */
    public function store(Request $request, Space $space)
    {
        if (!$space->canEdit($request->user())) {
            abort(403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'parent_id' => 'nullable|exists:pages,id',
            'content' => 'nullable|array', // Tiptap JSON
        ]);

        // Verify parent belongs to same space
        if (!empty($validated['parent_id'])) {
            $parent = Page::find($validated['parent_id']);
            if ($parent->space_id !== $space->id) {
                return response()->json(['message' => 'Parent page must belong to the same space.'], 422);
            }
        }

        // Calculate order (append to end)
        $order = Page::where('space_id', $space->id)
            ->where('parent_id', $validated['parent_id'] ?? null)
            ->max('order') + 1;

        $page = $space->pages()->create([
            'title' => $validated['title'],
            'parent_id' => $validated['parent_id'] ?? null,
            'content' => $validated['content'] ?? null,
            'order' => $order,
            'created_by' => $request->user()->id,
            'updated_by' => $request->user()->id,
        ]);

        return new PageResource($page);
    }

    /**
     * Get page details
     */
    public function show(Request $request, Space $space, Page $page)
    {
        if (!$space->canView($request->user())) {
            abort(403);
        }

        if ($page->space_id !== $space->id) {
            abort(404);
        }

        $page->load(['creator:id,name', 'updater:id,name']);

        return new PageResource($page);
    }

    /**
     * Update page
     */
    public function update(Request $request, Space $space, Page $page)
    {
        if (!$space->canEdit($request->user())) {
            abort(403);
        }

        if ($page->space_id !== $space->id) {
            abort(404);
        }

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'content' => 'nullable|array',
            'is_published' => 'boolean',
        ]);

        $validated['updated_by'] = $request->user()->id;

        $page->update($validated);
        
        $page->load('updater');

        return new PageResource($page);
    }

    /**
     * Delete page
     */
    public function destroy(Request $request, Space $space, Page $page): JsonResponse
    {
        if (!$space->canEdit($request->user())) {
            abort(403);
        }

        if ($page->space_id !== $space->id) {
            abort(404);
        }

        $page->delete();

        return response()->json(['message' => 'Page deleted successfully.']);
    }

    /**
     * Reorder pages
     */
    public function reorder(Request $request, Space $space): JsonResponse
    {
        if (!$space->canEdit($request->user())) {
            abort(403);
        }

        $validated = $request->validate([
            'pages' => 'required|array',
            'pages.*.id' => 'required|exists:pages,id',
            'pages.*.order' => 'required|integer',
            'pages.*.parent_id' => 'nullable|exists:pages,id',
        ]);

        foreach ($validated['pages'] as $item) {
            $page = Page::find($item['id']);
            if ($page && $page->space_id === $space->id) {
                $page->update([
                    'order' => $item['order'],
                    'parent_id' => $item['parent_id'] ?? null,
                ]);
            }
        }

        return response()->json(['message' => 'Order updated.']);
    }
}
