<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PageResource;
use App\Models\Page;
use App\Models\Site;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PageController extends Controller
{
    /**
     * List pages (tree structure)
     */
    public function index(Request $request, Site $site)
    {
        if (!$site->canView($request->user())) {
            abort(403);
        }

        $pages = $site->rootPages()
            ->with(['children']) // Resource handles recursive structure
            ->get();

        return PageResource::collection($pages);
    }

    /**
     * Create new page
     */
    public function store(Request $request, Site $site)
    {
        if (!$site->canEdit($request->user())) {
            abort(403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'parent_id' => 'nullable|exists:pages,id',
            'content' => 'nullable|array', // Tiptap JSON
            'icon' => 'nullable|string|max:255',
            'cover_image' => 'nullable|string|max:1000',
            'is_hidden' => 'boolean',
        ]);

        // Verify parent belongs to same site
        if (!empty($validated['parent_id'])) {
            $parent = Page::find($validated['parent_id']);
            if ($parent->site_id !== $site->id) {
                return response()->json(['message' => 'Parent page must belong to the same site.'], 422);
            }
        }

        // Calculate order (append to end)
        $order = Page::where('site_id', $site->id)
            ->where('parent_id', $validated['parent_id'] ?? null)
            ->max('order') + 1;

        $page = $site->pages()->create([
            'title' => $validated['title'],
            'parent_id' => $validated['parent_id'] ?? null,
            'content' => $validated['content'] ?? null,
            'icon' => $validated['icon'] ?? null,
            'cover_image' => $validated['cover_image'] ?? null,
            'is_hidden' => $validated['is_hidden'] ?? false,
            'order' => $order,
            'created_by' => $request->user()->id,
            'updated_by' => $request->user()->id,
        ]);

        return new PageResource($page);
    }

    /**
     * Get page details
     */
    public function show(Request $request, Site $site, Page $page)
    {
        if (!$site->canView($request->user())) {
            abort(403);
        }

        if ($page->site_id !== $site->id) {
            abort(404);
        }

        $page->load(['creator:id,name', 'updater:id,name']);

        return new PageResource($page);
    }

    /**
     * Update page
     */
    public function update(Request $request, Site $site, Page $page)
    {
        if (!$site->canEdit($request->user())) {
            abort(403);
        }

        if ($page->site_id !== $site->id) {
            abort(404);
        }

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'content' => 'nullable|array',
            'is_published' => 'boolean',
            'icon' => 'nullable|string|max:255',
            'cover_image' => 'nullable|string|max:1000',
            'is_hidden' => 'boolean',
        ]);

        $validated['updated_by'] = $request->user()->id;

        $page->update($validated);

        $page->load('updater');

        return new PageResource($page);
    }

    /**
     * Delete page
     */
    public function destroy(Request $request, Site $site, Page $page): JsonResponse
    {
        if (!$site->canEdit($request->user())) {
            abort(403);
        }

        if ($page->site_id !== $site->id) {
            abort(404);
        }

        $page->delete();

        return response()->json(['message' => 'Page deleted successfully.']);
    }

    /**
     * Reorder pages
     */
    public function reorder(Request $request, Site $site): JsonResponse
    {
        if (!$site->canEdit($request->user())) {
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
            if ($page && $page->site_id === $site->id) {
                $page->update([
                    'order' => $item['order'],
                    'parent_id' => $item['parent_id'] ?? null,
                ]);
            }
        }

        return response()->json(['message' => 'Order updated.']);
    }
}
