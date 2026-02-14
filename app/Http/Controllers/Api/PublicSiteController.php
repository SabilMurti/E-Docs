<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PageResource;
use App\Models\Page;
use App\Models\Site;
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
     * View published site details with page structure
     */
    public function show($identifier)
    {
        $site = $this->findSite($identifier);

        // Load root pages (pages without parent)
        // We assume 'pages' relation exists on Site model
        // To get full tree, we might need a recursive load or load all pages and build tree in frontend
        // For now let's load all published pages for this site and let frontend build the tree
        // This is more efficient than N+1 recursive queries for deep trees
        
        $pages = Page::where('site_id', $site->id)
            ->where('is_published', true)
            ->orderBy('order', 'asc')
            ->select(['id', 'site_id', 'parent_id', 'slug', 'title', 'icon', 'order', 'is_published'])
            ->get();

        return response()->json([
            'data' => [
                'id' => $site->id,
                'name' => $site->name,
                'slug' => $site->slug,
                'description' => $site->description,
                'logo_url' => $site->logo_url,
                'settings' => $site->settings,
                'owner' => $site->owner,
                'pages' => $pages // Return flat list of pages
            ]
        ]);
    }

    /**
     * View single page content
     */
    public function page($identifier, $pageId)
    {
        $site = $this->findSite($identifier);

        $page = Page::where('site_id', $site->id)
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
