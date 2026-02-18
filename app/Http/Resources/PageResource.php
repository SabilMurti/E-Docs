<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'site_id' => $this->site_id,
            'parent_id' => $this->parent_id,
            'title' => $this->title,
            'slug' => $this->slug,
            'content' => $this->content, // Tiptap JSON
            'order' => $this->order,
            'logical_id' => $this->logical_id,
            'branch_id' => $this->branch_id,
            'branch_name' => $this->whenLoaded('branch', fn() => $this->branch->name, $this->branch?->name),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'children' => PageResource::collection($this->whenLoaded('children')),
            'excerpt' => $this->when($this->content, function () {
                return null;
            }),
        ];
    }
}
