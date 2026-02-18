<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Commit;
use App\Models\CommitPage;
use App\Models\Page;
use App\Models\PullRequest;
use App\Models\Site;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PullRequestController extends Controller
{
    /**
     * List pull requests
     */
    public function index(Request $request, Site $site)
    {
        if (!$site->canView($request->user())) {
            abort(403);
        }

        $query = $site->pullRequests()
            ->with('author', 'sourceBranch', 'targetBranch', 'reviews.user');

        if ($request->has('status')) {
            $query->where('status', $request->status);
        } else {
            $query->where('status', 'open');
        }

        $prs = $query->orderByDesc('created_at')->get();

        // Add computed fields
        $prs->each(function ($pr) {
            $pr->is_approved = $pr->isApproved();
            $pr->has_changes_requested = $pr->hasChangesRequested();
            $pr->review_count = $pr->reviews->count();
        });

        return response()->json(['data' => $prs]);
    }

    /**
     * List pull requests relevant to a page (by its branch)
     */
    public function indexByPage(Request $request, Page $page)
    {
        $site = $page->site;
        if (!$site->canView($request->user())) {
            abort(403);
        }

        // Find PRs coming FROM this page's branch
        $prs = PullRequest::where('site_id', $site->id)
            ->where('source_branch_id', $page->branch_id)
            ->with('author', 'targetBranch', 'reviews.user')
            ->orderByDesc('created_at')
            ->get();

        return response()->json($prs);
    }

    /**
     * Create a pull request from a page context (Editor "Request Review" action)
     */
    public function storePageRequest(Request $request, Page $page)
    {
        $site = $page->site;
        if (!$site->canWrite($request->user())) {
            abort(403, 'You explicitly need write access to create a request.');
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'nullable|in:draft,open',
        ]);

        $sourceBranchId = $page->branch_id;
        $targetBranchId = $request->input('target_branch_id');
        
        // Default to main/master if no target specified
        if (!$targetBranchId) {
            $defaultBranch = Branch::where('site_id', $site->id)
                ->whereIn('name', ['main', 'master'])
                ->orderBy('name', 'asc')
                ->first();
            
            if ($defaultBranch) {
                $targetBranchId = $defaultBranch->id;
            }
        }

        if ($sourceBranchId === $targetBranchId) {
            return response()->json([
                'message' => 'You cannot create a pull request where the source and target branches are the same.',
                'code' => 'SAME_BRANCH_ERROR'
            ], 422);
        }

        if (!$targetBranchId) {
            return response()->json(['message' => 'Target branch not found.'], 422);
        }

        // Check if open PR already exists
        $existingPr = PullRequest::where('site_id', $site->id)
            ->where('source_branch_id', $sourceBranchId)
            ->where('target_branch_id', $targetBranchId)
            ->whereIn('status', ['open', 'draft'])
            ->first();

        if ($existingPr) {
            return response()->json([
                'message' => 'An open pull request already exists for this branch.',
                'data' => $existingPr->load('author', 'sourceBranch', 'targetBranch'),
            ], 200); // Return existing PR
        }

        return DB::transaction(function () use ($site, $sourceBranchId, $targetBranchId, $validated, $request) {
            $pr = PullRequest::create([
                'site_id' => $site->id,
                'source_branch_id' => $sourceBranchId,
                'target_branch_id' => $targetBranchId,
                'author_id' => $request->user()->id,
                'number' => PullRequest::nextNumber($site->id),
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'status' => $validated['status'] ?? 'open',
            ]);

            return response()->json([
                'message' => 'Pull request created.',
                'data' => $pr->load('author', 'sourceBranch', 'targetBranch'),
            ], 201);
        });
    }

    /**
     * Create a pull request
     */
    public function store(Request $request, Site $site)
    {
        if (!$site->canWrite($request->user())) {
            abort(403, 'You need write access to create pull requests.');
        }

        $validated = $request->validate([
            'source_branch_id' => 'required|uuid|exists:branches,id',
            'target_branch_id' => 'required|uuid|exists:branches,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'nullable|in:draft,open',
        ]);

        if ($validated['source_branch_id'] === $validated['target_branch_id']) {
            return response()->json(['message' => 'Source and target branches must be different.'], 422);
        }

        $pr = PullRequest::create([
            'site_id' => $site->id,
            'source_branch_id' => $validated['source_branch_id'],
            'target_branch_id' => $validated['target_branch_id'],
            'author_id' => $request->user()->id,
            'number' => PullRequest::nextNumber($site->id),
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'status' => $validated['status'] ?? 'open',
        ]);

        return response()->json([
            'message' => 'Pull request created.',
            'data' => $pr->load('author', 'sourceBranch', 'targetBranch'),
        ], 201);
    }

    /**
     * Show PR details (Global/Top-level route)
     */
    public function showFull(Request $request, PullRequest $pullRequest)
    {
        return $this->show($request, $pullRequest->site, $pullRequest);
    }

    /**
     * Merge PR (Global/Top-level route)
     */
    public function mergeFull(Request $request, PullRequest $pullRequest)
    {
        return $this->merge($request, $pullRequest->site, $pullRequest);
    }

    /**
     * Placeholder for PR commits
     */
    public function commits(Request $request, PullRequest $pullRequest)
    {
        return response()->json([]);
    }

    /**
     * Placeholder for branch sync
     */
    public function sync(Request $request, PullRequest $pullRequest)
    {
        return response()->json(['message' => 'Synced.']);
    }

    /**
     * Show PR details with diff
     */
    public function show(Request $request, Site $site, PullRequest $pullRequest)
    {
        if (!$site->canView($request->user())) {
            abort(403);
        }

        $pullRequest->load('author', 'sourceBranch', 'targetBranch', 'reviews.user', 'mergedByUser');

        // Calculate changes between branches
        $changes = $this->calculateChanges($pullRequest);

        $pullRequest->is_approved = $pullRequest->isApproved();
        $pullRequest->has_changes_requested = $pullRequest->hasChangesRequested();

        return response()->json([
            'pull_request' => $pullRequest,
            'changes' => $changes,
        ]);
    }

    /**
     * Update PR (title, description, status)
     */
    public function update(Request $request, Site $site, PullRequest $pullRequest)
    {
        if ($pullRequest->author_id !== $request->user()->id && !$site->canAdmin($request->user())) {
            abort(403, 'Only the author or admin can edit this PR.');
        }

        $validated = $request->validate([
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'status' => 'nullable|in:draft,open',
        ]);

        $pullRequest->update(array_filter($validated, fn($v) => $v !== null));

        return response()->json([
            'message' => 'Pull request updated.',
            'data' => $pullRequest->fresh()->load('author', 'sourceBranch', 'targetBranch'),
        ]);
    }

    /**
     * Merge PR
     */
    public function merge(Request $request, Site $site, PullRequest $pullRequest)
    {
        if (!$site->canMaintain($request->user())) {
            abort(403, 'You need maintain access to merge pull requests.');
        }

        if ($pullRequest->status !== 'open') {
            return response()->json(['message' => 'Only open pull requests can be merged.'], 400);
        }

        return DB::transaction(function () use ($request, $pullRequest) {
            $changes = $this->calculateChanges($pullRequest);
            
            // Block merge if conflicts exist
            $hasConflicts = collect($changes)->contains('has_conflict', true);
            if ($hasConflicts) {
                return response()->json([
                    'message' => 'This pull request has conflicts that must be resolved before merging.',
                    'conflicts' => collect($changes)->where('has_conflict', true)->values()
                ], 422);
            }

            $targetBranchId = $pullRequest->target_branch_id;

            foreach ($changes as $change) {
                $logicalId = $change['logical_id'];
                
                if ($change['type'] === 'deleted') {
                    // Delete page from target branch
                    Page::where('branch_id', $targetBranchId)
                        ->where('logical_id', $logicalId)
                        ->delete();
                } else {
                    $sourcePage = $change['page'];
                    
                    // Find matching page on target branch by logical_id
                    $targetPage = Page::where('branch_id', $targetBranchId)
                        ->where('logical_id', $logicalId)
                        ->first();

                    if ($targetPage) {
                        // Update existing page
                        $targetPage->update([
                            'title' => $sourcePage->title,
                            'content' => $sourcePage->content,
                        ]);
                    } else {
                        // Create new page on target branch
                        Page::create([
                            'site_id' => $pullRequest->site_id,
                            'branch_id' => $targetBranchId,
                            'logical_id' => $logicalId,
                            'parent_id' => $sourcePage->parent_id,
                            'title' => $sourcePage->title,
                            'slug' => $sourcePage->slug,
                            'content' => $sourcePage->content,
                            'order' => $sourcePage->order,
                        ]);
                    }
                }
            }

            $pullRequest->update([
                'status' => 'merged',
                'merged_by' => $request->user()->id,
                'merged_at' => now(),
            ]);

            return response()->json([
                'message' => 'Pull request merged successfully.',
                'data' => $pullRequest->fresh()->load('author', 'mergedByUser'),
            ]);
        });
    }

    /**
     * Close PR without merging
     */
    public function close(Request $request, Site $site, PullRequest $pullRequest)
    {
        if ($pullRequest->author_id !== $request->user()->id && !$site->canMaintain($request->user())) {
            abort(403, 'Only the author or maintainer can close this PR.');
        }

        if ($pullRequest->status === 'merged') {
            return response()->json(['message' => 'Cannot close a merged pull request.'], 400);
        }

        $pullRequest->update([
            'status' => 'closed',
            'closed_at' => now(),
        ]);

        return response()->json([
            'message' => 'Pull request closed.',
            'data' => $pullRequest->fresh(),
        ]);
    }

    /**
     * Delete PR
     */
    public function destroy(Request $request, Site $site, PullRequest $pullRequest)
    {
        $isAuthor = $pullRequest->author_id === $request->user()->id;
        $isAdmin = $site->canAdmin($request->user());

        if (!$isAuthor && !$isAdmin) {
            abort(403, 'Only the author or admin can delete this PR.');
        }

        if ($pullRequest->status === 'merged') {
            return response()->json(['message' => 'Cannot delete a merged pull request.'], 400);
        }

        $pullRequest->delete();

        return response()->json(['message' => 'Pull request deleted.']);
    }

    /**
     * Compare branches (preview before PR creation)
     */
    public function compare(Request $request, Site $site)
    {
        if (!$site->canView($request->user())) {
            abort(403);
        }

        $request->validate([
            'source_branch_id' => 'required|uuid|exists:branches,id',
            'target_branch_id' => 'required|uuid|exists:branches,id',
        ]);

        $sourceBranch = Branch::findOrFail($request->source_branch_id);
        $targetBranch = Branch::findOrFail($request->target_branch_id);

        $changes = $this->calculateBranchDiff(
            $site->id,
            $request->source_branch_id,
            $request->target_branch_id
        );

        return response()->json([
            'source_branch' => $sourceBranch,
            'target_branch' => $targetBranch,
            'changes' => $changes,
            'can_merge' => count($changes) > 0,
        ]);
    }

    /**
     * Calculate changed pages between PR branches
     */
    private function calculateChanges(PullRequest $pr): array
    {
        return $this->calculateBranchDiff(
            $pr->site_id,
            $pr->source_branch_id,
            $pr->target_branch_id
        );
    }

    /**
     * Calculate diff between two branches
     */
    private function calculateBranchDiff(string $siteId, string $sourceBranchId, string $targetBranchId): array
    {
        $changes = [];
        $sourcePages = Page::where('site_id', $siteId)
            ->where('branch_id', $sourceBranchId)
            ->get()
            ->keyBy('logical_id');

        $targetPages = Page::where('site_id', $siteId)
            ->where('branch_id', $targetBranchId)
            ->get()
            ->keyBy('logical_id');

        // Identification logic: 
        // Only consider pages that have actually been COMMITTED in the source branch.
        // This prevents overwriting target pages that changed in the target but were NOT touched in the source.
        $sourceCommits = Commit::where('branch_id', $sourceBranchId)
            ->orderBy('created_at', 'asc')
            ->get();

        $committedLogicalIds = CommitPage::whereIn('commit_id', $sourceCommits->pluck('id'))
            ->join('pages', 'commit_pages.page_id', '=', 'pages.id')
            ->pluck('pages.logical_id')
            ->unique()
            ->toArray();

        // Find the "base" content (the content before the first commit in source branch)
        // We look at the very first commit of each page in this branch
        $baseVersions = CommitPage::whereIn('commit_id', $sourceCommits->pluck('id'))
            ->join('pages', 'commit_pages.page_id', '=', 'pages.id')
            ->select('commit_pages.*', 'pages.logical_id') // Correct: Get content from commit_page, ID from page
            ->orderBy('commit_pages.created_at', 'asc')
            ->get()
            ->groupBy('logical_id')
            ->map(function($group) {
                return $group->first();
            });

        // Also include pages that currently exist in source but have no logical_id in target (New pages)
        $newPagesLogicalIds = $sourcePages->keys()->diff($targetPages->keys())->toArray();
        
        $relevantLogicalIds = array_unique(array_merge($committedLogicalIds, $newPagesLogicalIds));

        // Check source pages against target
        foreach ($relevantLogicalIds as $logicalId) {
            $sourcePage = $sourcePages->get($logicalId);
            $targetPage = $targetPages->get($logicalId);
            $baseVersion = $baseVersions->get($logicalId);

            if ($sourcePage && !$targetPage) {
                // New page (exists in source, not in target)
                $changes[] = [
                    'logical_id' => $logicalId,
                    'type' => 'added',
                    'page' => $sourcePage,
                    'source_title' => $sourcePage->title,
                    'source_content' => $sourcePage->content,
                    'target_title' => null,
                    'target_content' => null,
                    'has_conflict' => false,
                ];
            } elseif (!$sourcePage && $targetPage) {
                // Deleted in source branch
                $changes[] = [
                    'logical_id' => $logicalId,
                    'type' => 'deleted',
                    'page' => $targetPage, // Use target page for info
                    'source_title' => null,
                    'source_content' => null,
                    'target_title' => $targetPage->title,
                    'target_content' => $targetPage->content,
                    'has_conflict' => false, // TODO: Detect if target was also modified since base
                ];
            } elseif ($sourcePage && $targetPage) {
                // Check if modified
                $titleChanged = ($sourcePage->title !== $targetPage->title);
                $contentChanged = (json_encode($sourcePage->content) !== json_encode($targetPage->content));

                if ($titleChanged || $contentChanged) {
                    $diff = [];
                    if ($titleChanged) {
                        $diff['title'] = ['old' => $targetPage->title, 'new' => $sourcePage->title];
                    }
                    if ($contentChanged) {
                        $diff['content'] = ['old' => $targetPage->content, 'new' => $sourcePage->content];
                    }

                    // CONFLICT DETECTION:
                    // If target branch content has changed from what the source branch started with.
                    $hasConflict = false;
                    $conflictReason = null;

                    if ($baseVersion) {
                        $targetChangedFromBase = json_encode($targetPage->content) !== json_encode($baseVersion->previous_content) ||
                                              $targetPage->title !== $baseVersion->previous_title;
                        
                        if ($targetChangedFromBase) {
                            $hasConflict = true;
                            $conflictReason = "Both branches modified this page.";
                        }
                    }

                    $changes[] = [
                        'logical_id' => $logicalId,
                        'type' => 'modified',
                        'page' => $sourcePage,
                        'source_title' => $sourcePage->title,
                        'source_content' => $sourcePage->content,
                        'target_title' => $targetPage->title,
                        'target_content' => $targetPage->content,
                        'diff' => $diff,
                        'has_conflict' => $hasConflict,
                        'conflict_reason' => $conflictReason,
                        'base_content' => $baseVersion?->previous_content,
                        'base_title' => $baseVersion?->previous_title,
                    ];
                }
            }
        }



        return $changes;
    }
    /**
     * Resolve merge conflicts
     */
    public function resolve(Request $request, Site $site, PullRequest $pullRequest)
    {
        if (!$site->canMaintain($request->user())) {
            abort(403, 'You need maintain access to resolve pull request conflicts.');
        }

        if ($pullRequest->status !== 'open') {
            return response()->json(['message' => 'Only open pull requests can have conflicts resolved.'], 400);
        }

        $request->validate([
            'resolutions' => 'required|array',
            'resolutions.*.logical_id' => 'required|string',
            'resolutions.*.content' => 'required',
            'resolutions.*.title' => 'required|string',
        ]);

        return DB::transaction(function () use ($request, $pullRequest) {
            $resolutions = $request->input('resolutions');

            // Pre-load target branch pages keyed by logical_id for conflict base sync
            $targetPages = Page::where('branch_id', $pullRequest->target_branch_id)
                ->get()
                ->keyBy('logical_id');

            // Create a "Conflict Resolution" commit in the SOURCE branch
            $commit = Commit::create([
                'site_id' => $pullRequest->site_id,
                'branch_id' => $pullRequest->source_branch_id,
                'user_id' => $request->user()->id,
                'message' => 'Resolve merge conflicts in PR #' . $pullRequest->number,
            ]);

            foreach ($resolutions as $res) {
                $page = Page::where('branch_id', $pullRequest->source_branch_id)
                    ->where('logical_id', $res['logical_id'])
                    ->first();

                if ($page) {
                    $targetPage = $targetPages->get($res['logical_id']);

                    // KEY FIX: Set previous_content/title to TARGET branch values.
                    // This makes calculateBranchDiff() see the base as already synced
                    // with target, so it won't flag this page as conflicted again.
                    $previousContent = $targetPage?->content ?? $page->content;
                    $previousTitle   = $targetPage?->title   ?? $page->title;

                    $page->update([
                        'content' => $res['content'],
                        'title'   => $res['title'],
                    ]);

                    CommitPage::create([
                        'commit_id'        => $commit->id,
                        'page_id'          => $page->id,
                        'action'           => 'modified',
                        'title'            => $page->title,
                        'content'          => $page->content,
                        'previous_content' => $previousContent,
                        'previous_title'   => $previousTitle,
                    ]);
                }
            }

            return response()->json([
                'message' => 'Conflicts resolved successfully. A resolution commit has been added to the branch.',
                'commit'  => $commit,
            ]);
        });
    }
}
