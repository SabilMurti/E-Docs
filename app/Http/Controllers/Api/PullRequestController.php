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
        if (! $site->canView($request->user())) {
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
        if (! $site->canView($request->user())) {
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
        if (! $site->canWrite($request->user())) {
            abort(403, 'You explicitly need write access to create a request.');
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'nullable|in:draft,open',
        ]);

        // Get source branch from request (prefer explicit value over page's branch)
        $sourceBranchId = $request->input('source_branch_id', $page->branch_id);
        $targetBranchId = $request->input('target_branch_id');

        // Default to main/master if no target specified
        if (! $targetBranchId) {
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
                'code' => 'SAME_BRANCH_ERROR',
                'debug' => ['source' => $sourceBranchId, 'target' => $targetBranchId, 'page_branch' => $page->branch_id],
            ], 422);
        }

        if (! $targetBranchId) {
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
        if (! $site->canWrite($request->user())) {
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
     * Get commits on source branch that are not yet in target branch
     */
    public function commits(Request $request, PullRequest $pullRequest)
    {
        if (! $pullRequest->site->canView($request->user())) {
            abort(403);
        }

        // Commits on source branch, ordered by newest first
        $sourceCommits = Commit::where('branch_id', $pullRequest->source_branch_id)
            ->with('user', 'pages')
            ->orderByDesc('created_at')
            ->get();

        // Commits also on target branch (to exclude them)
        $targetCommitIds = Commit::where('branch_id', $pullRequest->target_branch_id)
            ->pluck('id');

        // Only return commits unique to the source branch
        $uniqueCommits = $sourceCommits->whereNotIn('id', $targetCommitIds)->values();

        return response()->json(['data' => $uniqueCommits]);
    }

    /**
     * Sync target branch content into the PR's source branch (git pull equivalent)
     */
    public function sync(Request $request, PullRequest $pullRequest)
    {
        if (! $pullRequest->site->canWrite($request->user())) {
            abort(403, 'Write access required to sync.');
        }

        if ($pullRequest->status !== 'open') {
            return response()->json(['message' => 'Only open PRs can be synced.'], 422);
        }

        $targetPages = Page::where('branch_id', $pullRequest->target_branch_id)->get();
        $sourcePages = Page::where('branch_id', $pullRequest->source_branch_id)
            ->pluck('logical_id')
            ->flip(); // logical_id => index map for fast lookup

        $synced = 0;
        DB::transaction(function () use ($targetPages, $pullRequest, &$synced) {
            foreach ($targetPages as $targetPage) {
                // Update existing source page if it exists in source branch
                $sourcePage = Page::where('branch_id', $pullRequest->source_branch_id)
                    ->where('logical_id', $targetPage->logical_id)
                    ->first();

                if ($sourcePage) {
                    $sourcePage->update([
                        'title' => $targetPage->title,
                        'content' => $targetPage->content,
                        'order' => $targetPage->order,
                    ]);
                    $synced++;
                }
                // Pages only in target (new pages added after PR opened) are not auto-created
                // to avoid overwriting source-branch-only changes
            }
        });

        return response()->json([
            'message' => "Synced {$synced} page(s) from target branch.",
            'synced' => $synced,
        ]);
    }

    /**
     * Show PR details with diff
     */
    public function show(Request $request, Site $site, PullRequest $pullRequest)
    {
        if (! $site->canView($request->user())) {
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
        if ($pullRequest->author_id !== $request->user()->id && ! $site->canAdmin($request->user())) {
            abort(403, 'Only the author or admin can edit this PR.');
        }

        $validated = $request->validate([
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'status' => 'nullable|in:draft,open',
        ]);

        $pullRequest->update(array_filter($validated, fn ($v) => $v !== null));

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
        if (! $site->canMaintain($request->user())) {
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
                    'conflicts' => collect($changes)->where('has_conflict', true)->values(),
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

                    // Use auto-merged content if available (3-way merge result),
                    // otherwise fall back to source content.
                    $finalContent = $change['merged_content'] ?? $sourcePage->content;
                    // For title: prefer source title (it edited it), unless only target changed
                    $finalTitle = $sourcePage->title;

                    // Find matching page on target branch by logical_id
                    $targetPage = Page::where('branch_id', $targetBranchId)
                        ->where('logical_id', $logicalId)
                        ->first();

                    if ($targetPage) {
                        // Update existing page with auto-merged content
                        $targetPage->update([
                            'title'   => $finalTitle,
                            'content' => $finalContent,
                        ]);
                    } else {
                        // Create new page on target branch
                        Page::create([
                            'site_id'   => $pullRequest->site_id,
                            'branch_id' => $targetBranchId,
                            'logical_id'=> $logicalId,
                            'parent_id' => $sourcePage->parent_id,
                            'title'     => $finalTitle,
                            'slug'      => $sourcePage->slug,
                            'content'   => $finalContent,
                            'order'     => $sourcePage->order,
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
        if ($pullRequest->author_id !== $request->user()->id && ! $site->canMaintain($request->user())) {
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

        if (! $isAuthor && ! $isAdmin) {
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
        if (! $site->canView($request->user())) {
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

        // ─── Content-based diff (like git diff tree) ─────────────────────────────
        //
        // Strategy: compare the ACTUAL content of every page that exists in either
        // branch.  A page is "changed" only if its title or content really differs.
        //
        // This is more reliable than commit-history tracking because:
        //   1. Commit history can be noisy (old commits re-appear across branches)
        //   2. main→aryaz merges would incorrectly flag every page because main has
        //      many commits touching all pages.
        //
        // Base versions (for 3-way conflict detection) are still pulled from the
        // most recent commit in the SOURCE branch.
        $sourceCommits = Commit::where('branch_id', $sourceBranchId)
            ->orderBy('created_at', 'asc')
            ->get();

        // Find the "base" content for conflict detection.
        // The true common ancestor for a page is the previous_content of the FIRST
        // commit on this branch. If we use the last commit, we mistakenly flag nodes
        // as "unchanged" just because they weren't edited in the very final commit.
        // We load without DB order to avoid SQL out-of-sort-memory, and process in PHP.
        $baseVersions = CommitPage::whereIn('commit_pages.commit_id', $sourceCommits->pluck('id'))
            ->join('pages', 'commit_pages.page_id', '=', 'pages.id')
            ->join('commits', 'commit_pages.commit_id', '=', 'commits.id')
            ->select('commit_pages.*', 'pages.logical_id', 'commits.message as commit_message')
            ->get()
            ->groupBy('logical_id')
            ->map(function ($group) {
                // UUID v7 id sorting gives chronological order
                $sorted = $group->sortBy('id');
                // If a resolution commit exists, it acts as a new sync point
                $resolution = $sorted->last(function ($cp) {
                    return str_starts_with($cp->commit_message, 'Resolve merge conflicts');
                });
                return $resolution ?: $sorted->first();
            });

        // All logical IDs across both branches
        $allLogicalIds = $sourcePages->keys()->merge($targetPages->keys())->unique()->toArray();

        // Only process pages where content actually differs OR new page added in source.
        // We deliberately EXCLUDE pages that exist only in target (not in source):
        // those pages were likely created in the target branch and should not be deleted by a merge.
        $relevantLogicalIds = array_filter($allLogicalIds, function ($lid) use ($sourcePages, $targetPages) {
            $sp = $sourcePages->get($lid);
            $tp = $targetPages->get($lid);

            // New page in source (not yet in target) — will be added
            if ($sp && !$tp) return true;

            // Only in target (not in source) — skip, don't delete it
            if (!$sp && $tp) return false;

            // Both exist — only include if content actually differs
            return $sp->title !== $tp->title
                || json_encode($sp->content) !== json_encode($tp->content);
        });


        // Check source pages against target
        foreach ($relevantLogicalIds as $logicalId) {
            $sourcePage = $sourcePages->get($logicalId);
            $targetPage = $targetPages->get($logicalId);
            $baseVersion = $baseVersions->get($logicalId);

            if ($sourcePage && ! $targetPage) {
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
            } elseif (! $sourcePage && $targetPage) {
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

                    // 3-WAY NODE-LEVEL MERGE (like GitHub):
                    // A conflict only occurs when the SAME node was changed by BOTH branches.
                    // If source changed node A and target changed node B, auto-merge both — no conflict.
                    $hasConflict = false;
                    $conflictReason = null;
                    $mergedContent = null;   // Result of auto-merge (used directly when no conflict)
                    $conflictingNodes = [];  // For partial conflicts

                    $baseContent = $baseVersion?->previous_content;

                    if ($baseContent && $contentChanged) {
                        $mergeResult = $this->threeWayMergeNodes(
                            $baseContent,
                            $sourcePage->content,  // "ours"
                            $targetPage->content   // "theirs"
                        );

                        $hasConflict      = $mergeResult['has_conflict'];
                        $conflictReason   = $hasConflict ? 'Both branches modified the same block.' : null;
                        $mergedContent    = $mergeResult['merged'];   // auto-merged doc (may be partial)
                        $conflictingNodes = $mergeResult['conflicts']; // Array of {index, base, ours, theirs}
                    } elseif (!$baseContent && $contentChanged) {
                        // No base snapshot available — cannot do true 3-way merge.
                        // BUT: both branches have different content, so we cannot safely
                        // auto-pick one side. Flag as conflict and show both versions
                        // to the user so they can decide.
                        $ourNodes   = $sourcePage->content['content'] ?? [];
                        $theirNodes = $targetPage->content['content'] ?? [];

                        $conflictingNodes = [];
                        $maxLen = max(count($ourNodes), count($theirNodes));

                        for ($i = 0; $i < $maxLen; $i++) {
                            $ourNode   = $ourNodes[$i]   ?? null;
                            $theirNode = $theirNodes[$i] ?? null;

                            if (json_encode($ourNode) !== json_encode($theirNode)) {
                                // These nodes differ between branches — show both
                                $conflictingNodes[] = [
                                    'index'  => $i,
                                    'base'   => null,        // no base known
                                    'ours'   => $ourNode,    // source branch version
                                    'theirs' => $theirNode,  // target branch version
                                ];
                            }
                        }

                        if (!empty($conflictingNodes)) {
                            $hasConflict      = true;
                            $conflictReason   = 'Both branches modified this page. No common base found — manual resolution required.';
                            $mergedContent    = $sourcePage->content; // placeholder; user must resolve
                        } else {
                            // No node-level diff found (shouldn't reach here but safety fallback)
                            $hasConflict   = false;
                            $mergedContent = $sourcePage->content;
                        }
                    }

                    // Title conflict: both changed title to different values
                    if ($titleChanged && $baseVersion) {
                        $sourceTitleChanged = ($sourcePage->title !== ($baseVersion->previous_title ?? null));
                        $targetTitleChanged = ($targetPage->title !== ($baseVersion->previous_title ?? null));
                        if ($sourceTitleChanged && $targetTitleChanged && $sourcePage->title !== $targetPage->title) {
                            $hasConflict    = true;
                            $conflictReason = ($conflictReason ?? '') . ' Title conflict.';
                        }
                    }

                    $changes[] = [
                        'logical_id'       => $logicalId,
                        'type'             => 'modified',
                        'page'             => $sourcePage,
                        'source_title'     => $sourcePage->title,
                        'source_content'   => $sourcePage->content,
                        'target_title'     => $targetPage->title,
                        'target_content'   => $targetPage->content,
                        'diff'             => $diff,
                        'has_conflict'     => $hasConflict,
                        'conflict_reason'  => $conflictReason,
                        'merged_content'   => $mergedContent,   // auto-merged result
                        'conflicting_nodes'=> $conflictingNodes,
                        'base_content'     => $baseContent,
                        'base_title'       => $baseVersion?->previous_title,
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
        if (! $site->canMaintain($request->user())) {
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
                'message' => 'Resolve merge conflicts in PR #'.$pullRequest->number,
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
                    $previousTitle = $targetPage?->title ?? $page->title;

                    $page->update([
                        'content' => $res['content'],
                        'title' => $res['title'],
                    ]);

                    CommitPage::create([
                        'commit_id' => $commit->id,
                        'page_id' => $page->id,
                        'action' => 'modified',
                        'title' => $page->title,
                        'content' => $page->content,
                        'previous_content' => $previousContent,
                        'previous_title' => $previousTitle,
                    ]);
                }
            }

            return response()->json([
                'message' => 'Conflicts resolved successfully. A resolution commit has been added to the branch.',
                'commit' => $commit,
            ]);
        });
    }

    /**
     * 3-Way merge at Tiptap node level.
     *
     * Like Git's line-level merge but for Tiptap document nodes (paragraphs,
     * headings, images, etc.)  A conflict only occurs when the same node
     * position was modified by BOTH branches.  Changes at different positions
     * are auto-merged.
     *
     * @param  array|null  $base   Common ancestor content (from commit snapshot)
     * @param  array       $ours   Source-branch content
     * @param  array       $theirs Target-branch content
     * @return array{has_conflict: bool, merged: array, conflicts: array}
     */
    private function threeWayMergeNodes(?array $base, array $ours, array $theirs): array
    {
        $baseNodes   = $base['content']   ?? [];
        $ourNodes    = $ours['content']   ?? [];
        $theirNodes  = $theirs['content'] ?? [];

        $maxLen  = max(count($baseNodes), count($ourNodes), count($theirNodes));
        $merged  = [];
        $hasConflict = false;
        $conflicts   = [];

        for ($i = 0; $i < $maxLen; $i++) {
            $baseNode  = $baseNodes[$i]  ?? null;
            $ourNode   = $ourNodes[$i]   ?? null;
            $theirNode = $theirNodes[$i] ?? null;

            $baseJson  = $baseNode  !== null ? json_encode($baseNode)  : null;
            $ourJson   = $ourNode   !== null ? json_encode($ourNode)   : null;
            $theirJson = $theirNode !== null ? json_encode($theirNode) : null;

            $ourChanged   = ($ourJson   !== $baseJson);
            $theirChanged = ($theirJson !== $baseJson);

            if (!$ourChanged && !$theirChanged) {
                // Both unchanged — keep base
                if ($baseNode !== null) $merged[] = $baseNode;

            } elseif ($ourChanged && !$theirChanged) {
                // Only source changed — use ours (may be new node or edit)
                if ($ourNode !== null) $merged[] = $ourNode;

            } elseif (!$ourChanged && $theirChanged) {
                // Only target changed — use theirs (auto-merge target's edit)
                if ($theirNode !== null) $merged[] = $theirNode;

            } else {
                // Both changed this position
                if ($ourJson === $theirJson) {
                    // Identical edit — no real conflict, take either
                    if ($ourNode !== null) $merged[] = $ourNode;
                } else {
                    // TRUE CONFLICT: same node modified differently
                    $hasConflict  = true;
                    $conflicts[]  = [
                        'index'  => $i,
                        'base'   => $baseNode,
                        'ours'   => $ourNode,
                        'theirs' => $theirNode,
                    ];
                    // Placeholder in merged — will be filled after user resolves
                    if ($ourNode !== null) $merged[] = $ourNode;
                }
            }
        }

        return [
            'has_conflict' => $hasConflict,
            'merged'       => ['type' => 'doc', 'content' => $merged],
            'conflicts'    => $conflicts,
        ];
    }
}
