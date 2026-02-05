<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SpaceMemberResource;
use App\Http\Resources\SpaceResource;
use App\Models\Space;
use App\Models\SpaceMember;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Mail;

class SpaceMemberController extends Controller
{
    /**
     * List members of a space (including owner)
     */
    public function index(Request $request, Space $space)
    {
        if (!$space->canView($request->user())) {
            abort(403);
        }

        // Get actual members
        $members = $space->memberships()
            ->with('user:id,name,email,avatar_url')
            ->orderBy('created_at')
            ->get();

        // Add owner as first "member" with owner role
        $owner = $space->owner;
        $ownerMember = new SpaceMember([
            'id' => 'owner-' . $owner->id,
            'space_id' => $space->id,
            'user_id' => $owner->id,
            'email' => $owner->email,
            'role' => 'owner',
            'status' => 'accepted',
        ]);
        $ownerMember->setRelation('user', $owner);
        
        // Prepend owner to the collection
        $allMembers = collect([$ownerMember])->concat($members);

        return SpaceMemberResource::collection($allMembers);
    }

    /**
     * Invite a member (or add existing user)
     */
    public function store(Request $request, Space $space)
    {
        if (!$space->canEdit($request->user())) {
            abort(403, 'Only owners and editors can invite members.');
        }

        $validated = $request->validate([
            'email' => 'required|email',
            'role' => 'required|in:editor,viewer',
        ]);

        $email = $validated['email'];

        // Check already member
        if ($space->memberships()->where('email', $email)->exists()) {
            return response()->json(['message' => 'User is already invited or a member.'], 422);
        }

        // Check if user exists in system
        $existingUser = User::where('email', $email)->first();

        // If user exists, directly add them as accepted member
        // Otherwise, create pending invite
        $member = $space->memberships()->create([
            'user_id' => $existingUser?->id,
            'email' => $email,
            'role' => $validated['role'],
            'status' => $existingUser ? 'accepted' : 'pending',
            'accepted_at' => $existingUser ? now() : null,
        ]);

        // TODO: Send invitation email for pending invites
        // Mail::to($email)->send(new \App\Mail\SpaceInvitationMail($space, $member));

        return new SpaceMemberResource($member->load('user'));
    }

    /**
     * Update member role
     */
    public function update(Request $request, Space $space, SpaceMember $member)
    {
        if ($space->user_id !== $request->user()->id) {
            abort(403, 'Only the owner can change roles.');
        }

        $validated = $request->validate([
            'role' => 'required|in:editor,viewer',
        ]);

        $member->update(['role' => $validated['role']]);

        return new SpaceMemberResource($member);
    }

    /**
     * Remove member or cancel invite
     */
    public function destroy(Request $request, Space $space, SpaceMember $member): JsonResponse
    {
        if ($space->user_id !== $request->user()->id) {
            abort(403, 'Only the owner can remove members.');
        }

        $member->delete();

        return response()->json(['message' => 'Member removed successfully.']);
    }

    /**
     * Accept invitation
     */
    public function acceptInvite(Request $request, Space $space, string $token)
    {
        $member = SpaceMember::where('space_id', $space->id)
            ->where('invite_token', $token)
            ->where('status', 'pending')
            ->firstOrFail();

        // Verify email matches current user
        if ($member->email !== $request->user()->email) {
            return response()->json(['message' => 'This invitation is for a different email address.'], 403);
        }

        $member->accept($request->user());

        return (new SpaceResource($space->load('owner')))
            ->additional(['message' => 'Invitation accepted.']);
    }
}
