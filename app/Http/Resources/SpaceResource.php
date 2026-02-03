<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SpaceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'visibility' => $this->visibility,
            'is_published' => $this->is_published,
            'owner' => new UserResource($this->whenLoaded('owner')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'pages_count' => $this->whenCounted('pages'),
            'members_count' => $this->whenCounted('members'),
            'current_user_role' => $this->when($this->pivot, function () {
                return $this->pivot->role ?? 'owner';
            }),
        ];
    }
}
