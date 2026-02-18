<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommitPage extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'commit_id',
        'page_id',
        'action',
        'title',
        'content',
        'previous_content',
        'previous_title',
    ];

    protected $casts = [
        'content' => 'array',
        'previous_content' => 'array',
    ];

    public function commit(): BelongsTo
    {
        return $this->belongsTo(Commit::class);
    }

    public function page(): BelongsTo
    {
        return $this->belongsTo(Page::class);
    }
}
