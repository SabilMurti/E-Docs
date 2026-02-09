<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PageResource;
use App\Models\Page;
use App\Models\Site;
use App\Models\Space;
use Illuminate\Http\Request;

class PublicSiteController extends Controller
{
    /**
     * Find site by identifier (UUID or slug)
     */
    private function findSite($identifier)
    {
        return Site::where(function ($query) use ($identifier) {
            $query->where('slug', $identifier)
                ->orWhere('id', $identifier);
        })
            ->where('is_published', true)
            ->firstOrFail();
    }

    /**
     * View published site details
     */
    public function show($identifier)
    {
        $site = $this->findSite($identifier);

        $site->load(['spaces' => function ($query) {
            $query->where('is_published', true)
                ->withCount('pages');
        }, 'owner:id,name,avatar_url']);

        return response()->json([
            'data' => [
                'id' => $site->id,
                'name' => $site->name,
                'slug' => $site->slug,
                'description' => $site->description,
                'logo_url' => $site->logo_url,
                'settings' => $site->settings,
                'owner' => $site->owner,
                'spaces' => $site->spaces->map(function ($space) {
                    return [
                        'id' => $space->id,
                        'name' => $space->name,
                        'slug' => $space->slug,
                        'label' => $space->pivot->label ?? $space->name,
                        'icon' => $space->pivot->icon,
                        'order' => $space->pivot->order,
                        'is_home' => $space->pivot->is_home,
                        'pages_count' => $space->pages_count,
                    ];
                }),
            ]
        ]);
    }

    /**
     * List spaces in a public site
     */
    public function spaces($identifier)
    {
        $site = $this->findSite($identifier);

        $spaces = $site->spaces()
            ->where('is_published', true)
            ->withCount('pages')
            ->get();

        return response()->json([
            'data' => $spaces->map(function ($space) {
                return [
                    'id' => $space->id,
                    'name' => $space->name,
                    'slug' => $space->slug,
                    'description' => $space->description,
                    'label' => $space->pivot->label ?? $space->name,
                    'icon' => $space->pivot->icon,
                    'order' => $space->pivot->order,
                    'is_home' => $space->pivot->is_home,
                    'pages_count' => $space->pages_count,
                ];
            })
        ]);
    }

    /**
     * View single space in a public site
     */
    public function space($identifier, $spaceId)
    {
        $site = $this->findSite($identifier);

        $space = $site->spaces()
            ->where(function ($query) use ($spaceId) {
                $query->where('spaces.id', $spaceId)
                    ->orWhere('spaces.slug', $spaceId);
            })
            ->where('is_published', true)
            ->withCount('pages')
            ->firstOrFail();

        return response()->json([
            'data' => [
                'id' => $space->id,
                'name' => $space->name,
                'slug' => $space->slug,
                'description' => $space->description,
                'label' => $space->pivot->label ?? $space->name,
                'icon' => $space->pivot->icon,
                'order' => $space->pivot->order,
                'is_home' => $space->pivot->is_home,
                'pages_count' => $space->pages_count,
            ]
        ]);
    }

    /**
     * View pages tree for a space in public site
     */
    public function pages($identifier, $spaceId)
    {
        $site = $this->findSite($identifier);

        $space = $site->spaces()
            ->where(function ($query) use ($spaceId) {
                $query->where('spaces.id', $spaceId)
                    ->orWhere('spaces.slug', $spaceId);
            })
            ->where('is_published', true)
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
    public function page($identifier, $spaceId, $pageId)
    {
        $site = $this->findSite($identifier);

        $space = $site->spaces()
            ->where(function ($query) use ($spaceId) {
                $query->where('spaces.id', $spaceId)
                    ->orWhere('spaces.slug', $spaceId);
            })
            ->where('is_published', true)
            ->firstOrFail();

        $page = Page::where('space_id', $space->id)
            ->where(function ($query) use ($pageId) {
                $query->where('id', $pageId)
                    ->orWhere('slug', $pageId);
            })
            ->where('is_published', true)
            ->with(['creator:id,name', 'updater:id,name'])
            ->firstOrFail();

        return new PageResource($page);
    }
}
