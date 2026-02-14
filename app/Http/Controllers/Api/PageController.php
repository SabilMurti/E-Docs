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

        // Get active branch
        $branchName = $request->query('branch', 'main');
        $branch = $site->branches()->where('name', $branchName)->first();

        if (!$branch) {
            // Fallback to default if not found, or error?
            // If explicit query param given and not found -> 404
            // If default 'main' not found (shouldn't happen) -> 404
            if ($branchName !== 'main') {
                 return response()->json(['message' => "Branch '{$branchName}' not found."], 404);
            }
            // If main doesn't exist (legacy/error), try finding any default branch
            $branch = $site->branches()->where('is_default', true)->first();
            if (!$branch) {
                 // Absolute fail-safe: any branch
                 $branch = $site->branches()->first();
            }
        }

        if (!$branch) {
             return response()->json(['data' => []]); // No branches? Empty site.
        }

        // Get pages for this branch
        $pages = $site->pages()
            ->where('branch_id', $branch->id)
            ->whereNull('parent_id')
            ->with(['children' => function($query) use ($branch) {
                // Ensure children are also from the same branch
                // Note: The `children` relation in model is simplified. 
                // We might need to adjust the relation or filter recursively.
                // Standard Eloquent `with` doesn't easily filter recursive relations unless we use package.
                // However, since `parent_id` points to a page ID, and that page ID is specific to a branch, 
                // the children relationship `parent_id` foreign key should naturally point to pages in the same branch
                // (assuming we handle copying correctly).
                // So filtering shouldn't be strictly necessary if integrity is maintained, 
                // but adding `where('branch_id', $branch->id)` is safer.
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
            'branch' => 'nullable|string', // Optional branch name, defaults to main
        ]);

        // Resolve branch
        $branchName = $validated['branch'] ?? 'main';
        $branch = $site->branches()->where('name', $branchName)->firstOrFail();
        
        // Verify user has permission on this branch?
        // Current requirement: "sabil creates site, automatically becomes admin, and sabil makes branch 'sabil'".
        // Assuming site editors can edit any branch for now unless we implement branch-level permissions.
        // User asked for "role or privillege" later.

        // Verify parent belongs to same site AND branch
        if (!empty($validated['parent_id'])) {
            $parent = Page::find($validated['parent_id']);
            if ($parent->site_id !== $site->id || $parent->branch_id !== $branch->id) {
                return response()->json(['message' => 'Parent page must belong to the same site and branch.'], 422);
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
            'logical_id' => \Illuminate\Support\Str::uuid(), // New page gets new logical ID
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
