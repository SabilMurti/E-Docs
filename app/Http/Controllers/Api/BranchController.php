<?php

namespace App\Http\Controllers\Api;

use App\Enums\BranchName;
use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Page;
use App\Models\Site;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BranchController extends Controller
{
    /**
     * List branches for a site
     */
    public function index(Request $request, Site $site)
    {
        if (! $site->canView($request->user())) {
            abort(403);
        }

        return response()->json([
            'data' => $site->branches()->orderBy('is_default', 'desc')->orderBy('name')->get(),
        ]);
    }

    /**
     * Create a new branch
     */
    public function store(Request $request, Site $site)
    {
        if (! $site->canEdit($request->user())) {
            abort(403, 'Permission denied.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'source_branch' => 'required|string|exists:branches,name',
        ]);

        // Check if branch name is reserved
        if (BranchName::isReserved($validated['name'])) {
            return response()->json([
                'message' => 'Branch name "'.$validated['name'].'" is reserved.',
            ], 422);
        }

        // Check if branch exists (including soft deleted)
        if ($site->branches()->withTrashed()->where('name', $validated['name'])->exists()) {
            return response()->json(['message' => 'Branch already exists.'], 422);
        }

        $sourceBranch = $site->branches()->where('name', $validated['source_branch'])->firstOrFail();

        return DB::transaction(function () use ($site, $validated, $sourceBranch) {
            // Create Branch
            $newBranch = $site->branches()->create([
                'name' => $validated['name'],
                'parent_branch_id' => $sourceBranch->id,
                'is_default' => false,
            ]);

            // Clone pages recursively
            $this->clonePagesRecursive($site, $sourceBranch, $newBranch, null, null);

            return response()->json([
                'message' => 'Branch created successfully.',
                'data' => $newBranch,
            ], 201);
        });
    }

    /**
     * Recursively clone pages from source branch to new branch
     */
    private function clonePagesRecursive(Site $site, Branch $sourceBranch, Branch $newBranch, ?string $sourceParentId, ?string $newParentId): void
    {
        // Get pages at this level from source branch
        $sourcePages = Page::where('branch_id', $sourceBranch->id)
            ->whereNull('deleted_at')
            ->where('parent_id', $sourceParentId)
            ->orderBy('order')
            ->get();

        foreach ($sourcePages as $sourcePage) {
            // Create new page
            $newPage = new Page;
            $newPage->id = (string) Str::uuid();
            $newPage->site_id = $site->id;
            $newPage->branch_id = $newBranch->id;
            $newPage->logical_id = $sourcePage->logical_id;
            $newPage->title = $sourcePage->title;
            $newPage->slug = $sourcePage->slug;
            $newPage->icon = $sourcePage->icon;
            $newPage->content = $sourcePage->content;
            $newPage->order = $sourcePage->order;
            $newPage->parent_id = $newParentId;

            $newPage->save();

            // Recursively clone children
            $this->clonePagesRecursive($site, $sourceBranch, $newBranch, $sourcePage->id, $newPage->id);
        }
    }

    /**
     * Delete branch
     */
    public function destroy(Request $request, Site $site, Branch $branch)
    {
        if (! $site->canEdit($request->user())) {
            abort(403);
        }

        if ($branch->site_id !== $site->id) {
            abort(404);
        }

        if ($branch->is_default) {
            return response()->json(['message' => 'Cannot delete default branch.'], 400);
        }

        DB::transaction(function () use ($branch) {
            Page::where('branch_id', $branch->id)->delete();
            $branch->delete();
        });

        return response()->json(['message' => 'Branch deleted.']);
    }
}
