<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Site;
use App\Models\Branch;
use App\Models\Page;
use App\Models\MergeRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Notifications\MergeRequestCreated;

class MergeRequestController extends Controller
{
    /**
     * Compare branches for mergeability
     */
    public function compare(Request $request, Site $site)
    {
        if (!$site->canView($request->user())) {
            abort(403);
        }

        $sourceId = $request->query('source');
        $targetId = $request->query('target');

        if (!$sourceId || !$targetId) {
            return response()->json(['message' => 'Source and target branches required.'], 400);
        }

        if ($sourceId === $targetId) {
             return response()->json([
                'can_merge' => false, 
                'status' => 'identical',
                'files_changed' => [],
                'message' => 'Branches are identical.'
             ]);
        }

        $sourcePages = Page::where('branch_id', $sourceId)->get()->keyBy('logical_id');
        $targetPages = Page::where('branch_id', $targetId)->get()->keyBy('logical_id');

        $changes = [];
        
        // Check for Added & Modified
        foreach ($sourcePages as $logicalId => $sourcePage) {
            if ($targetPage = $targetPages->get($logicalId)) {
                // Both have it. Check if changed.
                // Simple timestamp check. Since we update `updated_at` on every save.
                // If source is newer, it's a modification candidate.
                if ($sourcePage->updated_at > $targetPage->updated_at) {
                    // Check meaningful content change? (Hash check ideally)
                    // For now, assume timestamp implies change.
                    if (json_encode($sourcePage->content) !== json_encode($targetPage->content) || 
                        $sourcePage->title !== $targetPage->title) {
                        $changes[] = [
                            'type' => 'modified',
                            'page_id' => $sourcePage->id,
                            'title' => $sourcePage->title,
                            'logical_id' => $logicalId,
                        ];
                    }
                }
            } else {
                // New page in source
                $changes[] = [
                    'type' => 'added',
                    'page_id' => $sourcePage->id,
                    'title' => $sourcePage->title,
                    'logical_id' => $logicalId,
                ];
            }
        }

        // Check for Deleted (In target but not source)
        // Only if we support deletion sync. Let's assume yes.
        foreach ($targetPages as $logicalId => $targetPage) {
            if (!$sourcePages->has($logicalId)) {
                $changes[] = [
                    'type' => 'deleted',
                    'page_id' => $targetPage->id,
                    'title' => $targetPage->title,
                    'logical_id' => $logicalId,
                ];
            }
        }

        return response()->json([
            'can_merge' => true,
            'status' => count($changes) > 0 ? 'able_to_merge' : 'up_to_date',
            'files_changed' => $changes,
            'stats' => [
                'added' => collect($changes)->where('type', 'added')->count(),
                'modified' => collect($changes)->where('type', 'modified')->count(),
                'deleted' => collect($changes)->where('type', 'deleted')->count(),
            ]
        ]);
    }

    /**
     * List Merge Requests
     */
    public function index(Request $request, Site $site)
    {
        if (!$site->canView($request->user())) {
            abort(403);
        }

        $mrs = $site->mergeRequests()
            ->with(['sourceBranch', 'targetBranch', 'author'])
            ->latest()
            ->paginate(10);

        return response()->json($mrs);
    }

    /**
     * Create MR
     */
    public function store(Request $request, Site $site)
    {
        if (!$site->canEdit($request->user())) { // Editors can propose
            abort(403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'source_branch_id' => 'required|exists:branches,id',
            'target_branch_id' => 'required|exists:branches,id|different:source_branch_id',
        ]);

        // Validate branches belong to site
        $source = Branch::findOrFail($validated['source_branch_id']);
        $target = Branch::findOrFail($validated['target_branch_id']);

        if ($source->site_id !== $site->id || $target->site_id !== $site->id) {
            abort(400, 'Branches must belong to the site.');
        }

        // Check active MR already exists? Open MRs
        if ($site->mergeRequests()
            ->where('source_branch_id', $source->id)
            ->where('target_branch_id', $target->id)
            ->where('status', 'open')
            ->exists()) {
            return response()->json(['message' => 'An open merge request already exists for these branches.'], 409);
        }

        $mr = $site->mergeRequests()->create([
            'source_branch_id' => $validated['source_branch_id'],
            'target_branch_id' => $validated['target_branch_id'],
            'title' => $validated['title'],
            'description' => $validated['description'],
            'status' => 'open',
            'author_id' => $request->user()->id,
        ]);

        // Notify admins/owner?
        // $site->owner->notify(new MergeRequestCreated($mr));

        return response()->json($mr, 201);
    }

    /**
     * Show MR details & Diff
     */
    public function show(Request $request, Site $site, MergeRequest $mergeRequest)
    {
        if (!$site->canView($request->user())) {
            abort(403);
        }

        if ($mergeRequest->site_id !== $site->id) {
            abort(404);
        }
        
        $mergeRequest->load(['sourceBranch', 'targetBranch', 'author', 'reviewer', 'mergedBy']);

        // Calculating Diff... heavy operation for controller
        // Ideally should be async or on-demand
        // Simple approach: list changed pages
        
        $changedPages = $this->calculateChangedPages($mergeRequest);

        return response()->json([
            'mr' => $mergeRequest,
            'changes' => $changedPages
        ]);
    }

    /**
     * Merge Execution
     */
    public function merge(Request $request, Site $site, MergeRequest $mergeRequest)
    {
        // Only target branch owner or site admin can merge
        // "Reza -> review changes from sabil -> merged by reza"
        // Who owns "reza" branch? The user who created it?
        // We added 'created_by' to Branch model.
        // If target branch is 'main', site owner/admin can merge.
        // If target branch is 'reza', verify if current user is 'reza' (creator of branch) OR site admin.

        $targetBranch = $mergeRequest->targetBranch;
        $isTargetOwner = $targetBranch->created_by === $request->user()->id;
        $isSiteAdmin = $site->canMerge($request->user()); // Owner/Admin of site

        if (!$isTargetOwner && !$isSiteAdmin) {
            abort(403, 'Only the target branch owner or site admin can merge this request.');
        }

        if ($mergeRequest->status !== 'open') {
            abort(400, 'Merge request is not open.');
        }

        DB::transaction(function () use ($mergeRequest, $request, $site) {
            // Apply changes
            $this->applyMerge($mergeRequest);

            $mergeRequest->update([
                'status' => 'merged',
                'merged_by' => $request->user()->id,
                'merged_at' => now(),
            ]);
        });

        return response()->json(['message' => 'Merged successfully.']);
    }

    /**
     * Helper: Calculate changed pages
     */
    private function calculateChangedPages(MergeRequest $mr)
    {
        // Get all pages from source
        // Get all pages from target
        // Compare by logical_id
        // Return list of { page_title, status (added, updated, deleted) }

        // This is complex if many pages.
        // Simplification: Iterate source pages, check target. Then iterate target pages, check source for deletions.
        return []; // details implemented later
    }

    /**
     * Helper: Apply Merge
     */
    private function applyMerge(MergeRequest $mr)
    {
        // Pseudocode:
        // Source pages overwrites Target pages matching logical_id
        // New pages in Source are created in Target
        // Deleted pages in Source should be deleted in Target? (Hard to track deletion without soft deletes or tombstone)
        // For MVP: Content Update & New Page creation only.
        
        // 1. Get Source Pages
        $sourcePages = Page::where('branch_id', $mr->source_branch_id)->get();
        // 2. Get Target Pages (keyed by logical_id)
        $targetPages = Page::where('branch_id', $mr->target_branch_id)->get();
        $targetMap = $targetPages->keyBy('logical_id');

        foreach ($sourcePages as $sourcePage) {
            if ($targetPage = $targetMap->get($sourcePage->logical_id)) {
                // Update existing
                // Check if content changed?
                if ($sourcePage->updated_at > $targetPage->updated_at) { // Or content hash check
                   $targetPage->update([
                       'title' => $sourcePage->title,
                       'content' => $sourcePage->content,
                       'updated_by' => $mr->author_id, // Blame author
                       // 'parent_id' ... tricky if parent moved.
                       // Need parent_logical_id map?
                   ]);
                }
            } else {
                // Create new page in target branch
                $newPage = $sourcePage->replicate(['id', 'branch_id', 'created_at', 'updated_at']);
                $newPage->branch_id = $mr->target_branch_id;
                // ID? New UUID.
                $newPage->save();
            }
        }
    }
}
