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
            'space_id' => $this->space_id,
            'parent_id' => $this->parent_id,
            'title' => $this->title,
            'slug' => $this->slug,
            'content' => $this->content, // Tiptap JSON
            'order' => $this->order,
            'is_published' => $this->is_published,
            'created_by' => new UserResource($this->whenLoaded('creator')),
            'updated_by' => new UserResource($this->whenLoaded('updater')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'children' => PageResource::collection($this->whenLoaded('children')),
            'excerpt' => $this->when($this->content, function() {
                return $this->excerpt;
            }),
        ];
    }
}
