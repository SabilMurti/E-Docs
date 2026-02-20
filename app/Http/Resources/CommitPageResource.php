<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommitPageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'commit_id' => $this->commit_id,
            'page_id' => $this->page_id,
            'page' => new PageResource($this->whenLoaded('page')),
            'action' => $this->action,
            'title' => $this->title,
            'content' => $this->content,
            'previous_content' => $this->previous_content,
            'previous_title' => $this->previous_title,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
