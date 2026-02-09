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

        if ($existingDraft && $data['status'] === 'draft') {
            $existingDraft->update([
                'content' => $data['content'] ?? $existingDraft->content,
                'title' => $data['title'] ?? $existingDraft->title,
                'description' => $data['description'] ?? $existingDraft->description,
            ]);
            return response()->json($existingDraft);
        }

        // Create new request (Draft or Open PR)
        $changeRequest = $page->changeRequests()->create([
            'user_id' => auth()->id(),
            'title' => $data['title'] ?? $page->title,
            'content' => $data['content'] ?? $page->content,
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
    public function merge(PageChangeRequest $changeRequest)
    {
        // TODO: Add Authorization check here (Owner/Admin only)
        
        if ($changeRequest->status !== 'open') {
            return response()->json(['message' => 'Only open requests can be merged'], 400);
        }

        DB::transaction(function () use ($changeRequest) {
            $page = $changeRequest->page;

            // Apply changes to Page (This triggers Page Observer to create revision)
            $page->update([
                'title' => $changeRequest->title,
                'content' => $changeRequest->content,
                'updated_by' => auth()->id(),
            ]);

            // Mark request as merged
            $changeRequest->update(['status' => 'merged']);
            
            // Close other drafts?? Maybe keep them.
        });

        return response()->json(['message' => 'Changes merged successfully', 'page' => $changeRequest->page]);
    }
}
