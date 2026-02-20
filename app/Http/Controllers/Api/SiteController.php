<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateSiteRequest;
use App\Http\Requests\UpdateSiteRequest;
use App\Models\Site;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SiteController extends Controller
{
    /**
     * List user's sites
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $sites = Site::where('user_id', $user->id)
            ->orWhereHas('members', function($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->withCount('pages')
            ->latest()
            ->get();

        return response()->json(['data' => $sites]);
    }

    /**
     * Create a new site
     */
    public function store(CreateSiteRequest $request)
    {
        $validated = $request->validated();

        $site = Site::create([
            'user_id' => $request->user()->id,
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'logo_url' => $validated['logo_url'] ?? null,
            'settings' => $validated['settings'] ?? [
                'theme' => 'dark',
                'accent_color' => '#10b981',
                'show_footer' => true,
            ],
            'is_published' => false,
        ]);

        // Auto-create 'main' branch for the site
        $site->branches()->create([
            'name' => 'main',
            'is_default' => true,
            'created_by' => $request->user()->id,
        ]);

        return response()->json([
            'data' => $site,
            'message' => 'Site created successfully.'
        ], 201);
    }

    /**
     * Get site details
     */
    public function show(Request $request, Site $site)
    {
        if (!$site->canView($request->user())) {
            abort(403, 'You do not have access to this site.');
        }

        // Load root pages for the sidebar tree
        $site->load(['rootPages.children', 'owner:id,name,avatar_url']);
        $site->loadCount('pages');

        return response()->json([
            'data' => $site
        ]);
    }

    /**
     * Update site
     */
    public function update(UpdateSiteRequest $request, Site $site)
    {
        $validated = $request->validated();

        // Auto-update slug if name changed and slug wasn't explicitly provided
        if ($request->has('name') && !$request->has('slug')) {
            $baseSlug = \Illuminate\Support\Str::slug($validated['name']);
            $slug = $baseSlug;
            $counter = 1;

            // Check if slug exists (excluding current site)
            while (Site::where('slug', $slug)->where('id', '!=', $site->id)->exists()) {
                $slug = $baseSlug . '-' . $counter;
                $counter++;
            }

            $validated['slug'] = $slug;
        }

        $site->update(array_filter($validated, fn($key) => $request->has($key), ARRAY_FILTER_USE_KEY));

        return response()->json([
            'data' => $site,
            'message' => 'Site updated successfully.',
            'public_url' => $site->public_url
        ]);
    }

    /**
     * Delete site
     */
    public function destroy(Request $request, Site $site): JsonResponse
    {
        if ($site->user_id !== $request->user()->id) {
            abort(403, 'Only the owner can delete this site.');
        }

        $site->delete();

        return response()->json(['message' => 'Site deleted successfully.']);
    }

    /**
     * Publish site
     */
    public function publish(Request $request, Site $site)
    {
        if (!$site->canEdit($request->user())) {
            abort(403, 'Only the owner can publish this site.');
        }

        $site->update(['is_published' => true]);

        return response()->json([
            'data' => $site,
            'message' => 'Site published successfully.',
            'public_url' => $site->public_url
        ]);
    }

    /**
     * Unpublish site
     */
    public function unpublish(Request $request, Site $site)
    {
        if (!$site->canEdit($request->user())) {
            abort(403, 'Only the owner can unpublish this site.');
        }

        $site->update(['is_published' => false]);

        return response()->json([
            'data' => $site,
            'message' => 'Site unpublished successfully.'
        ]);
    }

    /**
     * Republish site (regenerate slug and public URL)
     */
    public function republish(Request $request, Site $site)
    {
        if (!$site->canEdit($request->user())) {
            abort(403, 'Only the owner can republish this site.');
        }

        // Regenerate slug from name
        $baseSlug = \Illuminate\Support\Str::slug($site->name);
        $slug = $baseSlug;
        $counter = 1;

        // Check if slug exists (excluding current site)
        while (Site::where('slug', $slug)->where('id', '!=', $site->id)->exists()) {
            $slug = $baseSlug . '-' . $counter;
            $counter++;
        }

        $site->update(['slug' => $slug]);

        return response()->json([
            'data' => $site,
            'message' => 'Site republished successfully.',
            'public_url' => $site->public_url,
            'old_slug' => $request->input('old_slug')
        ]);
    }
}
