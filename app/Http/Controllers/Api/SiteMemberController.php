<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Site;
use App\Models\User;
use Illuminate\Http\Request;

class SiteMemberController extends Controller
{
    /**
     * List all members of a site
     */
    public function index(Site $site)
    {
        // Check if user has access to view this site
        if (!$site->canView(auth()->user())) {
            abort(403, 'Unauthorized access to site members.');
        }

        // Load members with their pivot data
        $site->load('members');

        // Also include owner in the list for display purposes?
        // Let's keep owner separate in frontend logic usually, but here we can just return members.
        
        return response()->json([
            'data' => $site->members->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name, // Assuming name exists on User model
                    'email' => $user->email,
                    'avatar_url' => $user->avatar_url, // Assuming Accessor or column
                    'role' => $user->pivot->role,
                    'joined_at' => $user->pivot->created_at,
                ];
            })
        ]);
    }

    /**
     * Add a new member to the site
     */
    public function store(Request $request, Site $site)
    {
        // Ensure user has permission to manage members
        // Typically owner or admin role
        $currentUser = auth()->user();
        $isOwner = $site->user_id === $currentUser->id;
        
        // Members check for admin role
        $isAdmin = $site->members()
            ->where('user_id', $currentUser->id)
            ->where('role', 'admin')
            ->exists();

        if (!$isOwner && !$isAdmin) {
             abort(403, 'You do not have permission to invite members.');
        }

        $request->validate([
            'email' => 'required|email',
            'role' => 'required|in:admin,editor,viewer',
        ]);

        $targetUser = User::where('email', $request->email)->first();

        if (!$targetUser) {
            return response()->json([
                'message' => 'User not found. Please ensure the user has registered with this email.'
            ], 404);
        }

        if ($site->user_id === $targetUser->id) {
            return response()->json(['message' => 'User is the owner of this site.'], 400); 
        }

        if ($site->members()->where('user_id', $targetUser->id)->exists()) {
            return response()->json(['message' => 'User is already a member.'], 400);
        }

        // Add member
        $site->members()->attach($targetUser->id, ['role' => $request->role]);

        return response()->json([
            'message' => 'Member added successfully.',
            'data' => [
                'id' => $targetUser->id,
                'name' => $targetUser->name,
                'email' => $targetUser->email,
                'role' => $request->role,
            ]
        ]);
    }

    /**
     * Remove a member from the site
     */
    public function destroy(Site $site, string $userId)
    {
        $currentUser = auth()->user();
        $isOwner = $site->user_id === $currentUser->id;
        $isAdmin = $site->members()->where('user_id', $currentUser->id)->where('role', 'admin')->exists();

        if (!$isOwner && !$isAdmin) {
             abort(403, 'You do not have permission to remove members.');
        }

        // Prevent removing self if not owner (leaving site logic should be different endpoint usually, but ok for now)
        if ($userId === $currentUser->id && !$isOwner) {
            // User leaving logic? 
            // Allow user to remove themselves (Leaf)
        } elseif ($userId === $currentUser->id && $isOwner) {
             abort(400, 'Owner cannot leave the site. Transfer ownership first.');
        }

        if ($site->user_id === $userId) {
             abort(400, 'Cannot remove site owner.');
        }

        $site->members()->detach($userId);

        return response()->json(['message' => 'Member removed successfully.']);
    }
}
