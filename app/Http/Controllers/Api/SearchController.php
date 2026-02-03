<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Page;
use App\Models\Space;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SearchController extends Controller
{
    /**
     * Search within a space
     */
    public function search(Request $request, Space $space): JsonResponse
    {
        if (!$space->canView($request->user())) {
            abort(403);
        }

        $query = $request->input('q');

        if (!$query) {
            return response()->json([]);
        }

        // Search logic based on driver
        if (\Illuminate\Support\Facades\DB::connection()->getDriverName() === 'sqlite') {
             $results = Page::where('space_id', $space->id)
                ->where('title', 'LIKE', "%{$query}%")
                ->limit(20)
                ->get();
        } else {
            // MySQL Boolean Mode Search
            $results = Page::where('space_id', $space->id)
                ->whereRaw('MATCH(title) AGAINST(? IN BOOLEAN MODE)', [$query])
                ->select('id', 'title', 'slug', 'space_id', 'parent_id')
                ->limit(20)
                ->get();
        }
        
        // Fallback for MySQL if strict match yields nothing
        if ($results->isEmpty() && \Illuminate\Support\Facades\DB::connection()->getDriverName() !== 'sqlite') {
             $results = Page::where('space_id', $space->id)
                ->where('title', 'LIKE', "%{$query}%")
                ->limit(20)
                ->get();
        }

        $results->transform(function ($page) {
            return [
                'id' => $page->id,
                'title' => $page->title,
                'slug' => $page->slug,
                'excerpt' => $page->excerpt, // Assuming accessor exists
                'url' => "/spaces/{$page->space_id}/pages/{$page->slug}" // Frontend URL structure helper
            ];
        });

        return response()->json(['data' => $results]);
    }
}
