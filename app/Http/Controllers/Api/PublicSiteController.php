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
            ->with('owner:id,name,avatar_url')
            ->firstOrFail();
    }

    /**
     * Search within a published site
     */
    public function search(Request $request, $identifier)
    {
        $site = $this->findSite($identifier);

        $validated = $request->validate([
            'q' => 'required|string|min:1',
        ]);

        $query = $validated['q'];

        // Find the default branch
        $defaultBranch = $site->branches()->where('is_default', true)->first();

        $baseQuery = Page::where('site_id', $site->id);

        if ($defaultBranch) {
            $baseQuery->where('branch_id', $defaultBranch->id);
        }

        // Search in title and content
        $results = $baseQuery
            ->where(function ($q) use ($query) {
                $q->where('title', 'LIKE', "%{$query}%")
                  ->orWhere('content', 'LIKE', "%{$query}%");
            })
            ->limit(20)
            ->get();

        $results->transform(function ($page) use ($site, $query) {
            return [
                'id' => $page->id,
                'title' => $page->title,
                'slug' => $page->slug,
                'excerpt' => $this->generateExcerpt($page->content, $query),
                'url' => "/public/{$site->slug}/{$page->slug}",
            ];
        });

        return response()->json(['data' => $results]);
    }

    /**
     * Generate excerpt from content with highlighted search term
     */
    private function generateExcerpt(?array $content, string $query): string
    {
        if (!$content) {
            return '';
        }

        $text = $this->extractTextFromContent($content);

        // Find and highlight the search term
        $pos = stripos($text, $query);
        if ($pos !== false) {
            $start = max(0, $pos - 50);
            $end = min(strlen($text), $pos + strlen($query) + 50);
            $excerpt = substr($text, $start, $end - $start);

            if ($start > 0) {
                $excerpt = '...' . $excerpt;
            }
            if ($end < strlen($text)) {
                $excerpt = $excerpt . '...';
            }

            return $excerpt;
        }

        return substr($text, 0, 150) . (strlen($text) > 150 ? '...' : '');
    }

    /**
     * Extract plain text from Tiptap JSON content
     */
    private function extractTextFromContent(array $content): string
    {
        $text = '';

        if (isset($content['content'])) {
            foreach ($content['content'] as $node) {
                if (isset($node['text'])) {
                    $text .= $node['text'] . ' ';
                }
                if (isset($node['content'])) {
                    $text .= $this->extractTextFromContent($node);
                }
            }
        }

        return trim($text);
    }

    /**
     * View published site details with page structure
     */
    public function show($identifier)
    {
        $site = $this->findSite($identifier);

        // Find the default branch
        $defaultBranch = $site->branches()->where('is_default', true)->first();

        $pagesQuery = Page::where('site_id', $site->id);

        if ($defaultBranch) {
            $pagesQuery->where('branch_id', $defaultBranch->id);
        }

        $pages = $pagesQuery->orderBy('order', 'asc')
            ->select(['id', 'site_id', 'parent_id', 'slug', 'title', 'icon', 'order', 'branch_id'])
            ->get();

        return response()->json([
            'data' => [
                'id' => $site->id,
                'name' => $site->name,
                'slug' => $site->slug,
                'description' => $site->description,
                'logo_url' => $site->logo_url,
                'settings' => $site->settings,
                'owner' => $site->owner ? [
                    'id' => $site->owner->id,
                    'name' => $site->owner->name,
                    'avatar_url' => $site->owner->avatar_url,
                ] : null,
                'pages' => $pages
            ]
        ]);
    }

    /**
     * View single page content
     */
    public function page($identifier, $pageSlug)
    {
        $site = $this->findSite($identifier);

        $defaultBranch = $site->branches()->where('is_default', true)->first();

        $pageQuery = Page::where('site_id', $site->id)
            ->where(function ($query) use ($pageSlug) {
                $query->where('id', $pageSlug)
                    ->orWhere('slug', $pageSlug);
            });

        if ($defaultBranch) {
            $pageQuery->where('branch_id', $defaultBranch->id);
        }

        $page = $pageQuery->firstOrFail();

        return response()->json([
            'data' => [
                'id' => $page->id,
                'site_id' => $page->site_id,
                'parent_id' => $page->parent_id,
                'title' => $page->title,
                'slug' => $page->slug,
                'content' => $page->content,
                'order' => $page->order,
                'branch_id' => $page->branch_id,
                'created_at' => $page->created_at,
                'updated_at' => $page->updated_at,
            ]
        ]);
    }
}
