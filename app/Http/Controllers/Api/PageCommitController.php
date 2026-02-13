<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Page;
use App\Models\PageChangeRequest;
use App\Models\PageCommit;
use App\Models\Site;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PageCommitController extends Controller
{
    /**
     * Store a new commit (Save to Self)
     */
    public function store(Request $request, $siteId, Page $page)
    {
        $site = Site::findOrFail($siteId);

        if (!$site->canEdit($request->user())) {
            abort(403);
        }

        if ($page->site_id !== $site->id) {
            abort(404);
        }

        $validated = $request->validate([
            'title' => 'nullable|string',
            'content' => 'required|array',
            'message' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($page, $validated) {
            // Find existing draft for this user
            $changeRequest = PageChangeRequest::where('page_id', $page->id)
                ->where('user_id', auth()->id())
                ->where('status', 'draft')
                ->first();

            $requestTitle = $validated['message'] ?: ($validated['title'] ?? $page->title);

            // 1. Update the actual Page Content (Save to Branch)
            // This ensures the branch moves forward and changes serve as the new "base"
            $page->update([
                'title' => $validated['title'] ?? $page->title,
                'content' => $validated['content'],
                'updated_by' => auth()->id(),
            ]);

            if (!$changeRequest) {
                // If no draft exists, create one with the NEW content as base (since we just updated the page)
                $changeRequest = PageChangeRequest::create([
                    'page_id' => $page->id,
                    'user_id' => auth()->id(),
                    'base_title' => $page->title,
                    'base_content' => $page->content, // New content
                    'title' => $requestTitle,
                    'content' => $validated['content'],
                    'status' => 'draft',
                ]);
            } else {
                // Update current draft to match the new HEAD of the branch
                $changeRequest->update([
                    'title' => $requestTitle,
                    'content' => $validated['content'],
                    'base_content' => $validated['content'], // Sync base to new Page content
                    'base_title' => $validated['title'] ?? $page->title,
                ]);
            }

            // Create the commit record (The history)
            $commit = $changeRequest->commits()->create([
                'page_id' => $page->id,
                'user_id' => auth()->id(),
                'title' => $validated['title'] ?? $changeRequest->title,
                'content' => $validated['content'],
                'message' => $validated['message'] ?? 'Update content',
            ]);

            return response()->json([
                'message' => 'Committed successfully',
                'commit' => $commit,
                'request' => $changeRequest
            ], 201);
        });
    }

    /**
     * List commits for a specific page (global history)
     */
    public function index($siteId, Page $page)
    {
        return response()->json(
            $page->commits()
                ->with('user')
                ->latest()
                ->get()
        );
    }

    /**
     * List commits for a specific change request
     */
    public function indexByRequest(PageChangeRequest $changeRequest)
    {
        return response()->json(
            $changeRequest->commits()
                ->with('user')
                ->latest()
                ->get()
        );
    }
}
