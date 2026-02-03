<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Page extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'space_id',
        'parent_id',
        'title',
        'slug',
        'content',
        'order',
        'is_published',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'content' => 'array',
        'is_published' => 'boolean',
        'order' => 'integer',
    ];

    protected static function booted(): void
    {
        static::creating(function (Page $page) {
            if (empty($page->slug)) {
                $page->slug = Str::slug($page->title);
            }
        });

        static::updating(function (Page $page) {
            // Create revision on content update
            if ($page->isDirty('content') || $page->isDirty('title')) {
                $original = $page->getOriginal();
                if ($original['content'] !== null) {
                    PageRevision::create([
                        'page_id' => $page->id,
                        'user_id' => $page->updated_by,
                        'content' => $original['content'],
                        'title' => $original['title'],
                        'revision_number' => $page->revisions()->count() + 1,
                    ]);
                }
            }
        });
    }

    /**
     * The space this page belongs to
     */
    public function space(): BelongsTo
    {
        return $this->belongsTo(Space::class);
    }

    /**
     * Parent page (if nested)
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Page::class, 'parent_id');
    }

    /**
     * Child pages
     */
    public function children(): HasMany
    {
        return $this->hasMany(Page::class, 'parent_id')->orderBy('order');
    }

    /**
     * All revisions of this page
     */
    public function revisions(): HasMany
    {
        return $this->hasMany(PageRevision::class)->orderByDesc('revision_number');
    }

    /**
     * User who created this page
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * User who last updated this page
     */
    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Get page tree (recursive)
     */
    public function getTreeAttribute(): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'order' => $this->order,
            'is_published' => $this->is_published,
            'children' => $this->children->map->tree->toArray(),
        ];
    }

    /**
     * Generate excerpt from content
     */
    public function getExcerptAttribute(): string
    {
        if (!$this->content) {
            return '';
        }

        $text = $this->extractTextFromContent($this->content);
        return Str::limit($text, 150);
    }

    /**
     * Extract plain text from Tiptap JSON content
     */
    protected function extractTextFromContent(array $content): string
    {
        $text = '';

        if (isset($content['content'])) {
            foreach ($content['content'] as $node) {
                if (isset($node['text'])) {
                    $text .= $node['text'] . ' ';
                }
                if (isset($node['content'])) {
                    $text .= $this->extractTextFromContent($node);
                }
            }
        }

        return trim($text);
    }
}
