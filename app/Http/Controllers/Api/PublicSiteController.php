<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PageResource;
use App\Models\Page;
use App\Models\Site;

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
        
        // Find the default branch
        $defaultBranch = $site->branches()->where('is_default', true)->first();
        
        $pagesQuery = Page::where('site_id', $site->id)
            ->where('is_published', true);

        if ($defaultBranch) {
            $pagesQuery->where('branch_id', $defaultBranch->id);
        }

        $pages = $pagesQuery->orderBy('order', 'asc')
            ->select(['id', 'site_id', 'parent_id', 'slug', 'title', 'icon', 'order', 'is_published', 'branch_id'])
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

        $defaultBranch = $site->branches()->where('is_default', true)->first();

        $pageQuery = Page::where('site_id', $site->id)
            ->where(function ($query) use ($pageId) {
                $query->where('id', $pageId)
                    ->orWhere('slug', $pageId);
            })
            ->where('is_published', true);

        if ($defaultBranch) {
            $pageQuery->where('branch_id', $defaultBranch->id);
        }

        $page = $pageQuery->with(['creator:id,name', 'updater:id,name'])
            ->firstOrFail();

        return new PageResource($page);
    }
}
