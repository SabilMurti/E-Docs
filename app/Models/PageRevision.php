<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PageRevision extends Model
{
    use HasFactory, HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'page_id',
        'user_id',
        'content',
        'title',
        'revision_number',
        'change_summary',
        'created_at',
    ];

    protected $casts = [
        'content' => 'array',
        'revision_number' => 'integer',
        'created_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (PageRevision $revision) {
            if (!$revision->created_at) {
                $revision->created_at = now();
            }
        });
    }

    /**
     * The page this revision belongs to
     */
    public function page(): BelongsTo
    {
        return $this->belongsTo(Page::class);
    }

    /**
     * The user who created this revision
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Restore this revision to the page
     */
    public function restore(): Page
    {
        $page = $this->page;
        $page->update([
            'title' => $this->title,
            'content' => $this->content,
            'updated_by' => auth()->id(),
        ]);

        return $page->fresh();
    }
}
