<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreatePageRequest;
use App\Http\Requests\UpdatePageRequest;
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

        // Get active branch
        $branchName = $request->query('branch', 'main');
        $branch = $site->branches()->where('name', $branchName)->first();

        if (!$branch) {
            if ($branchName !== 'main') {
                 return response()->json(['message' => "Branch '{$branchName}' not found."], 404);
            }
            $branch = $site->branches()->where('is_default', true)->first();
            if (!$branch) {
                 $branch = $site->branches()->first();
            }
        }

        if (!$branch) {
             return response()->json(['data' => []]);
        }

        // Get pages for this branch with recursive children
        $pages = $site->pages()
            ->where('branch_id', $branch->id)
            ->whereNull('parent_id')
            ->with(['branch', 'allChildren' => function($query) use ($branch) {
                // Ensure recursive children also respect the branch
                $query->where('branch_id', $branch->id)->orderBy('order');
            }])
            ->orderBy('order')
            ->get();

        return PageResource::collection($pages)->additional([
            'meta' => [
                'current_branch' => [
                    'id' => $branch->id,
                    'name' => $branch->name,
                    'is_default' => $branch->is_default
                ]
            ]
        ]);
    }

    /**
     * Create new page
     */
    public function store(CreatePageRequest $request, Site $site)
    {
        $validated = $request->validated();

        // Resolve branch
        $branchName = $validated['branch'] ?? 'main';
        $branch = $site->branches()->where('name', $branchName)->firstOrFail();

        // Calculate depth and validate max 5 levels
        $parentId = $validated['parent_id'] ?? null;
        if ($parentId) {
            $parent = Page::findOrFail($parentId);
            $depth = 1;
            $currentParent = $parent;
            while ($currentParent->parent_id) {
                $depth++;
                $currentParent = Page::findOrFail($currentParent->parent_id);
                if ($depth >= 5) {
                    return response()->json([
                        'message' => 'Maximum nesting level (5) reached.'
                    ], 422);
                }
            }
        }

        // Calculate order (append to end)
        $order = Page::where('site_id', $site->id)
            ->where('branch_id', $branch->id)
            ->where('parent_id', $validated['parent_id'] ?? null)
            ->max('order') + 1;

        $page = $site->pages()->create([
            'title' => $validated['title'],
            'branch_id' => $branch->id,
            'logical_id' => \Illuminate\Support\Str::uuid(),
            'parent_id' => $validated['parent_id'] ?? null,
            'content' => $validated['content'] ?? null,
            'order' => $order,
        ]);

        $page->load('branch');
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

        $page->load(['branch', 'parent']);

        return new PageResource($page);
    }

    /**
     * Update page
     */
    public function update(UpdatePageRequest $request, Site $site, Page $page)
    {
        $validated = $request->validated();

        $page->update($validated);
        $page->load('branch');

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
     * Duplicate a page (create a copy with same content)
     */
    public function duplicate(Request $request, Site $site, Page $page): \Illuminate\Http\JsonResponse
    {
        if (!$site->canEdit($request->user())) {
            abort(403);
        }

        if ($page->site_id !== $site->id) {
            abort(404);
        }

        // Calculate order — place copy right after the original
        $order = Page::where('site_id', $site->id)
            ->where('branch_id', $page->branch_id)
            ->where('parent_id', $page->parent_id)
            ->max('order') + 1;

        $duplicate = $site->pages()->create([
            'title'      => 'Copy of ' . $page->title,
            'branch_id'  => $page->branch_id,
            'logical_id' => \Illuminate\Support\Str::uuid(),
            'parent_id'  => $page->parent_id,
            'content'    => $page->content,
            'icon'       => $page->icon,
            'order'      => $order,
        ]);

        $duplicate->load('branch');

        return response()->json([
            'message' => 'Page duplicated successfully.',
            'data'    => new PageResource($duplicate),
        ], 201);
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
