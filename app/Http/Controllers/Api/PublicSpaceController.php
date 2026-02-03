<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PageResource;
use App\Http\Resources\SpaceResource;
use App\Models\Page;
use App\Models\Space;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PublicSpaceController extends Controller
{
    /**
     * View published space details
     */
    public function show($slug)
    {
        $space = Space::where('slug', $slug)
            ->where('is_published', true)
            ->where('visibility', 'public')
            ->with(['owner:id,name,avatar_url'])
            ->withCount(['pages', 'members'])
            ->firstOrFail();

        return new SpaceResource($space);
    }

    /**
     * View pages tree for public space
     */
    public function pages($slug)
    {
        $space = Space::where('slug', $slug)
            ->where('is_published', true)
            ->where('visibility', 'public')
            ->firstOrFail();

        $pages = $space->rootPages()
            ->with('children')
            ->where('is_published', true)
            ->get();

        return PageResource::collection($pages);
    }

    /**
     * View single page content
     */
    public function page($slug, $pageSlug)
    {
        $space = Space::where('slug', $slug)
            ->where('is_published', true)
            ->where('visibility', 'public')
            ->firstOrFail();

        $page = Page::where('space_id', $space->id)
            ->where('slug', $pageSlug)
            ->where('is_published', true)
            ->with(['creator:id,name', 'updater:id,name'])
            ->firstOrFail();

        return new PageResource($page);
    }
}
