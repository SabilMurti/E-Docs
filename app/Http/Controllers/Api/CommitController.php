<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\CommitResource;
use App\Http\Controllers\Controller;
use App\Models\Commit;
use App\Models\CommitPage;
use App\Models\Page;
use App\Models\Site;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CommitController extends Controller
{
    /**
     * List commits for a site (optionally filtered by branch)
     */
    public function index(Request $request, Site $site)
    {
        if (!$site->canView($request->user())) {
            abort(403);
        }

        $query = $site->commits()->with('user', 'branch', 'pages');

        if ($request->has('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        // Filter commits that touched a specific page (by page slug or UUID)
        if ($request->has('page_id')) {
            $pageId = $request->page_id;
            $query->whereHas('pages', function ($q) use ($pageId) {
                $q->where('page_id', $pageId);
            });
        }

        $commits = $query->orderByDesc('created_at')->paginate(30);

        return CommitResource::collection($commits);
    }

    /**
     * Create a commit (snapshot of one or more page changes)
     */
    public function store(Request $request, Site $site)
    {
        if (!$site->canWrite($request->user())) {
            abort(403, 'You do not have write access to this site.');
        }

        $validated = $request->validate([
            'branch_id' => 'required|uuid|exists:branches,id',
            'message' => 'required|string|max:255',
            'pages' => 'required|array|min:1',
            'pages.*.page_id' => 'required|uuid|exists:pages,id',
            'pages.*.action' => 'required|in:added,modified,deleted',
            'pages.*.title' => 'nullable|string',
            'pages.*.content' => 'nullable|array',
        ]);

        return DB::transaction(function () use ($site, $validated, $request) {
            $commit = Commit::create([
                'site_id' => $site->id,
                'branch_id' => $validated['branch_id'],
                'user_id' => $request->user()->id,
                'message' => $validated['message'],
            ]);

            foreach ($validated['pages'] as $pageData) {
                $page = Page::findOrFail($pageData['page_id']);

                $commitPage = CommitPage::create([
                    'commit_id' => $commit->id,
                    'page_id' => $page->id,
                    'action' => $pageData['action'],
                    'title' => $pageData['title'] ?? $page->title,
                    'content' => $pageData['content'] ?? $page->content,
                    'previous_content' => $page->content,
                    'previous_title' => $page->title,
                ]);

                // Apply changes to the page
                if ($pageData['action'] === 'deleted') {
                    $page->delete();
                } else {
                    $page->update([
                        'title'   => $pageData['title'] ?? $page->title,
                        'content' => $pageData['content'] ?? $page->content,
                        // Note: author info is stored in commits.user_id, not duplicated here
                    ]);
                }
            }

            return response()->json([
                'message' => 'Committed successfully',
                'commit' => $commit->load('user', 'pages', 'branch'),
            ], 201);
        });
    }

    /**
     * Create a commit for a single page (direct from editor)
     */
    public function storePage(Request $request, Site $site, Page $page)
    {
        if (!$site->canWrite($request->user())) {
            abort(403, 'You do not have write access to this site.');
        }

        $validated = $request->validate([
            'message' => 'required|string|max:255',
            'content' => 'nullable|array',
            'title' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($site, $page, $validated, $request) {
            // Create commit record
            $commit = Commit::create([
                'site_id' => $site->id,
                'branch_id' => $page->branch_id, // Assume current branch of page
                'user_id' => $request->user()->id,
                'message' => $validated['message'],
            ]);

            // Create commit detail record
            CommitPage::create([
                'commit_id' => $commit->id,
                'page_id' => $page->id,
                'action' => 'modified',
                'title' => $validated['title'] ?? $page->title,
                'content' => $validated['content'] ?? $page->content,
                'previous_content' => $page->content, // Capture previous state
                'previous_title' => $page->title,
            ]);

            // Update the page content
            $page->update([
                'title'   => $validated['title'] ?? $page->title,
                'content' => $validated['content'] ?? $page->content,
                // Note: author info is stored in commits.user_id, not duplicated here
            ]);

            return response()->json([
                'message' => 'Page committed successfully.',
                'commit' => $commit->load('pages'),
            ], 201);
        });
    }

    /**
     * Show a single commit with its diff
     */
    public function show(Request $request, Site $site, Commit $commit)
    {
        if (!$site->canView($request->user())) {
            abort(403);
        }

        $commit->load('user', 'branch', 'pages.page');

        return new CommitResource($commit);
    }
}
