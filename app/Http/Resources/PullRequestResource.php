<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PullRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'number' => $this->number,
            'site_id' => $this->site_id,
            'title' => $this->title,
            'description' => $this->description,
            'status' => $this->status,
            'source_branch' => new BranchResource($this->whenLoaded('sourceBranch')),
            'target_branch' => new BranchResource($this->whenLoaded('targetBranch')),
            'author' => new UserResource($this->whenLoaded('author')),
            'merged_by' => new UserResource($this->whenLoaded('mergedByUser')),
            'merged_at' => $this->merged_at,
            'closed_at' => $this->closed_at,
            'is_approved' => $this->whenNotNull($this->is_approved),
            'has_changes_requested' => $this->whenNotNull($this->has_changes_requested),
            'review_count' => $this->whenNotNull($this->review_count),
            'reviews' => PullRequestReviewResource::collection($this->whenLoaded('reviews')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
