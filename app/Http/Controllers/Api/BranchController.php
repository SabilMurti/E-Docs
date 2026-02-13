<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Page;
use App\Models\Site;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class BranchController extends Controller
{
    /**
     * List branches for a site
     */
    public function index(Request $request, Site $site)
    {
        if (!$site->canView($request->user())) {
            abort(403);
        }

        return response()->json([
            'data' => $site->branches()->orderBy('is_default', 'desc')->orderBy('name')->get()
        ]);
    }

    /**
     * Create a new branch
     */
    public function store(Request $request, Site $site)
    {
        if (!$site->canEdit($request->user())) {
            abort(403, 'Permission denied.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255|not_in:main', // 'main' is reserved/default usually
            'source_branch' => 'required|string|exists:branches,name',
        ]);

        // Check if branch exists
        if ($site->branches()->where('name', $validated['name'])->exists()) {
             return response()->json(['message' => 'Branch already exists.'], 409);
        }

        $sourceBranch = $site->branches()->where('name', $validated['source_branch'])->firstOrFail();

        return DB::transaction(function () use ($site, $validated, $sourceBranch, $request) {
            // Create Branch
            $newBranch = $site->branches()->create([
                'name' => $validated['name'],
                'created_by' => $request->user()->id,
                'is_default' => false,
            ]);

            // Clone Pages
            $sourcePages = Page::where('branch_id', $sourceBranch->id)->get();
            
            // Map old ID to new UUID
            $idMap = [];
            foreach ($sourcePages as $page) {
                $idMap[$page->id] = (string) Str::uuid();
            }

            // Pass 1: Create pages with null parent_id to avoid FK constraint violations
            $newPages = [];
            foreach ($sourcePages as $page) {
                $newPage = $page->replicate(['id', 'branch_id', 'created_at', 'updated_at', 'parent_id']);
                $newPage->id = $idMap[$page->id];
                $newPage->branch_id = $newBranch->id;
                $newPage->created_by = $request->user()->id;
                $newPage->updated_by = $request->user()->id;
                $newPage->parent_id = null; // Temporarily null
                
                $newPage->save();
                $newPages[] = $newPage;
            }

            // Pass 2: Restore parent_id hierarchy
            foreach ($sourcePages as $page) {
                if ($page->parent_id && isset($idMap[$page->parent_id])) {
                    // Update the newly created page
                    // We can use direct DB update to be faster/simpler, or find and update model
                    // Using DB query to avoid re-hydrating models
                    DB::table('pages')
                        ->where('id', $idMap[$page->id])
                        ->update(['parent_id' => $idMap[$page->parent_id]]);
                }
            }

            return response()->json([
                'message' => 'Branch created successfully.',
                'data' => $newBranch
            ], 201);
        });
    }

    /**
     * Delete branch
     */
    public function destroy(Request $request, Site $site, Branch $branch)
    {
        if (!$site->canEdit($request->user())) {
            abort(403);
        }

        if ($branch->site_id !== $site->id) {
            abort(404);
        }

        if ($branch->is_default) {
            return response()->json(['message' => 'Cannot delete default branch.'], 400);
        }

        // Delete branch (cascades or soft deletes)
        // Check migration: $table->foreignUuid('branch_id')... cascade?
        // In migration we made it nullable without cascade definition in the add_column migration?
        // Actually we didn't define constraint in the add_column migration because "We can't immediately add foreign key".
        // So we need to manually delete pages.
        
        DB::transaction(function () use ($branch) {
            Page::where('branch_id', $branch->id)->delete();
            $branch->delete();
        });

        return response()->json(['message' => 'Branch deleted.']);
    }
}
