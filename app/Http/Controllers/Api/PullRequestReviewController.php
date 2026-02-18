<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PullRequest;
use App\Models\PullRequestReview;
use App\Models\Site;
use Illuminate\Http\Request;

class PullRequestReviewController extends Controller
{
    /**
     * List reviews for a pull request
     */
    public function index(Request $request, Site $site, PullRequest $pullRequest)
    {
        if (!$site->canView($request->user())) {
            abort(403);
        }

        $reviews = $pullRequest->reviews()->with('user')->orderBy('created_at')->get();

        return response()->json(['data' => $reviews]);
    }

    /**
     * Submit a review
     */
    public function store(Request $request, Site $site, PullRequest $pullRequest)
    {
        if (!$site->canWrite($request->user())) {
            abort(403, 'You need write access to submit reviews.');
        }

        if ($pullRequest->author_id === $request->user()->id) {
            return response()->json(['message' => 'You cannot review your own pull request.'], 422);
        }

        if ($pullRequest->status !== 'open') {
            return response()->json(['message' => 'Can only review open pull requests.'], 400);
        }

        $validated = $request->validate([
            'status' => 'required|in:approved,changes_requested,commented',
            'body' => 'nullable|string',
        ]);

        $review = PullRequestReview::create([
            'pull_request_id' => $pullRequest->id,
            'user_id' => $request->user()->id,
            'status' => $validated['status'],
            'body' => $validated['body'] ?? null,
        ]);

        return response()->json([
            'message' => 'Review submitted.',
            'data' => $review->load('user'),
        ], 201);
    }
}
