<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SpaceMemberResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user' => new UserResource($this->whenLoaded('user')),
            'email' => $this->email,
            'role' => $this->role,
            'status' => $this->status,
            'invited_at' => $this->invited_at,
            'accepted_at' => $this->accepted_at,
        ];
    }
}
