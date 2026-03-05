<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $includeContent = true;
        
        // If it's a GET request for a list of pages (no {page} parameter), omit content to reduce payload size
        if ($request->isMethod('GET') && $request->route('page') === null) {
            $includeContent = false;
        }

        return [
            'id' => $this->id,
            'site_id' => $this->site_id,
            'parent_id' => $this->parent_id,
            'title' => $this->title,
            'icon' => $this->icon,
            'slug' => $this->slug,
            'content' => $this->when($includeContent, $this->content), // Tiptap JSON
            'order' => $this->order,
            'logical_id' => $this->logical_id,
            'branch_id' => $this->branch_id,
            'branch_name' => $this->whenLoaded('branch', fn() => $this->branch->name, $this->branch?->name),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'children' => PageResource::collection($this->whenLoaded('allChildren')),
            'excerpt' => $this->when($this->content, fn() => $this->excerpt),
        ];
    }
}
