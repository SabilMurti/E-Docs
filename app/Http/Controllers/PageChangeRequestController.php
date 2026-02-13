<?php

namespace App\Http\Controllers;

use App\Models\Page;
use App\Models\PageChangeRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PageChangeRequestController extends Controller
{
    /**
     * List change requests for a page
     */
    public function index(Page $page)
    {
        // Return open requests + user's own drafts
        $requests = $page->changeRequests()
            ->where(function($q) {
                $q->where('status', 'open')
                  ->orWhere('user_id', auth()->id());
            })
            ->with('user')
            ->get();
            
        return response()->json($requests);
    }

    /**
     * Create or update a change request (Draft or PR)
     */
    public function store(Request $request, Page $page)
    {
        $data = $request->validate([
            'content' => 'nullable|array',
            'title' => 'nullable|string',
            'description' => 'nullable|string',
            'status' => 'required|in:draft,open', // draft = save progress, open = request review
        ]);

        // Cek jika user sudah punya DRAFT untuk page ini, update saja
        $existingDraft = $page->changeRequests()
            ->where('user_id', auth()->id())
            ->where('status', 'draft')
            ->first();

        if ($existingDraft) {
            $existingDraft->update([
                'content' => $data['content'] ?? $existingDraft->content,
                'title' => $data['title'] ?? $existingDraft->title,
                'description' => $data['description'] ?? $existingDraft->description,
                'status' => $data['status'], // Bisa berubah dari draft ke open
            ]);
            return response()->json($existingDraft);
        }

        // Create new request (Draft or Open PR)
        // If creating new, we must have initial state
        $changeRequest = $page->changeRequests()->create([
            'user_id' => auth()->id(),
            'title' => $data['title'] ?? $page->title,
            'content' => $data['content'] ?? $page->content,
            'base_title' => $page->title,
            'base_content' => $page->content,
            'description' => $data['description'],
            'status' => $data['status'],
        ]);

        return response()->json($changeRequest, 201);
    }

    /**
     * Get details of a change request
     */
    public function show(PageChangeRequest $changeRequest)
    {
        return response()->json($changeRequest->load('user', 'page'));
    }

    /**
     * Merge a change request into the main page
     */
    public function merge(Request $request, PageChangeRequest $changeRequest)
    {
        $page = $changeRequest->page;

        if (!$page->site->canMerge(auth()->user())) {
            abort(403, 'You do not have permission to merge or approve changes on this site. Owner/Admin approval required.');
        }

        if ($changeRequest->status !== 'open') {
            return response()->json(['message' => 'Only open requests can be merged'], 400);
        }

        $page = $changeRequest->page;

        // Conflict Detection: 
        // If current page content is different from the base_content this PR was started with,
        // it means someone else merged something in between.
        $currentContentJson = json_encode($page->content);
        $baseContentJson = json_encode($changeRequest->base_content);
        $prContentJson = json_encode($changeRequest->content);

        // If page has changed AND it doesn't match our proposed change (already merged)
        if ($currentContentJson !== $baseContentJson && $currentContentJson !== $prContentJson) {
            return response()->json([
                'error' => 'conflict',
                'message' => 'This request has conflicts that must be resolved before merging.',
                'live_content' => $page->content,
                'live_title' => $page->title,
                'current_user_name' => auth()->user()->name,
                'contributor_name' => $changeRequest->user->name ?? 'Contributor',
            ], 409);
        }

        $data = $request->validate([
            'content' => 'nullable|array',
            'title' => 'nullable|string',
        ]);

        DB::transaction(function () use ($changeRequest, $data) {
            $page = $changeRequest->page;

            $mergedTitle = $data['title'] ?? $changeRequest->title;
            $mergedContent = $data['content'] ?? $changeRequest->content;

            $page->update([
                'title' => $mergedTitle,
                'content' => $mergedContent,
                'updated_by' => auth()->id(),
            ]);

            $changeRequest->update(['status' => 'merged']);
        });

        return response()->json([
            'message' => 'Changes merged successfully', 
            'page' => $changeRequest->page->load('updater')
        ]);
    }

    /**
     * Git Pull: Sync draft with latest live version (Rebase)
     */
    public function sync(PageChangeRequest $changeRequest)
    {
        if ($changeRequest->user_id !== auth()->id()) {
            abort(403);
        }

        if ($changeRequest->status !== 'draft') {
            return response()->json(['message' => 'Only drafts can be synced'], 400);
        }

        $page = $changeRequest->page;

        $changeRequest->update([
            'base_title' => $page->title,
            'base_content' => $page->content,
        ]);

        return response()->json([
            'message' => 'Draft synced with live version successfully',
            'request' => $changeRequest
        ]);
    }
}
