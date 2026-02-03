<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PageResource;
use App\Http\Resources\PageRevisionResource;
use App\Models\Page;
use App\Models\PageRevision;
use App\Models\Space;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PageRevisionController extends Controller
{
    /**
     * List revisions for a page
     */
    public function index(Request $request, Space $space, Page $page)
    {
        if (!$space->canView($request->user())) {
            abort(403);
        }

        if ($page->space_id !== $space->id) {
            abort(404);
        }

        $revisions = $page->revisions()
            ->with('user:id,name,avatar_url')
            ->select(['id', 'page_id', 'user_id', 'title', 'revision_number', 'change_summary', 'created_at']) // Exclude full content for list
            ->get();

        return PageRevisionResource::collection($revisions);
    }

    /**
     * Get specific revision details
     */
    public function show(Request $request, Space $space, Page $page, PageRevision $revision)
    {
        if (!$space->canView($request->user())) {
            abort(403);
        }

        if ($page->space_id !== $space->id || $revision->page_id !== $page->id) {
            abort(404);
        }

        $revision->load('user:id,name,avatar_url');

        return new PageRevisionResource($revision);
    }

    /**
     * Restore a revision
     */
    public function restore(Request $request, Space $space, Page $page, PageRevision $revision)
    {
        if (!$space->canEdit($request->user())) {
            abort(403);
        }

        if ($page->space_id !== $space->id || $revision->page_id !== $page->id) {
            abort(404);
        }

        $restoredPage = $revision->restore();

        return (new PageResource($restoredPage))
            ->additional(['message' => 'Page restored to revision #' . $revision->revision_number]);
    }
}
