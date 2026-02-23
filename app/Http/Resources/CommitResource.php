<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommitResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'site_id' => $this->site_id,
            'branch_id' => $this->branch_id,
            'branch' => new BranchResource($this->whenLoaded('branch')),
            'user_id' => $this->user_id,
            'user' => new UserResource($this->whenLoaded('user')),
            'message' => $this->message,
            'hash' => $this->hash,
            'short_hash' => $this->short_hash,
            'pages' => CommitPageResource::collection($this->whenLoaded('pages')),
            'pages_count' => $this->whenCounted('pages'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
