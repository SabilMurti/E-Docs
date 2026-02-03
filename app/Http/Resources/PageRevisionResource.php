<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PageRevisionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'page_id' => $this->page_id,
            'user' => new UserResource($this->whenLoaded('user')),
            'title' => $this->title,
            'content' => $this->when($this->content !== null, $this->content), // Exclude if not loaded or null
            'revision_number' => $this->revision_number,
            'change_summary' => $this->change_summary,
            'created_at' => $this->created_at,
        ];
    }
}
