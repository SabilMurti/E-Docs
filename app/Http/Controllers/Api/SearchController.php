<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Page;
use App\Models\Site;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SearchController extends Controller
{
    /**
     * Search within a site
     */
    public function search(Request $request, Site $site): JsonResponse
    {
        if (!$site->canView($request->user())) {
            abort(403);
        }

        $validated = $request->validate([
            'q' => 'required|string|min:1',
            'branch_id' => 'nullable|uuid'
        ]);

        $query = $validated['q'];
        $branchId = $validated['branch_id'];

        $baseQuery = Page::where('site_id', $site->id);
        
        if ($branchId) {
            $baseQuery->where('branch_id', $branchId);
        }

        // Search logic based on driver
        if (\Illuminate\Support\Facades\DB::connection()->getDriverName() === 'sqlite') {
             $results = $baseQuery
                ->where('title', 'LIKE', "%{$query}%")
                ->limit(20)
                ->get();
        } else {
            // MySQL Boolean Mode Search
            $results = $baseQuery
                ->whereRaw('MATCH(title) AGAINST(? IN BOOLEAN MODE)', [$query])
                ->limit(20)
                ->get();
        }
        
        // Fallback for MySQL if strict match yields nothing
        if ($results->isEmpty() && \Illuminate\Support\Facades\DB::connection()->getDriverName() !== 'sqlite') {
             $results = $baseQuery
                ->where('title', 'LIKE', "%{$query}%")
                ->limit(20)
                ->get();
        }

        $results->transform(function ($page) {
            return [
                'id' => $page->id,
                'title' => $page->title,
                'slug' => $page->slug,
                'url' => "/sites/{$page->site_id}/pages/{$page->id}" 
            ];
        });

        return response()->json(['data' => $results]);
    }
}
