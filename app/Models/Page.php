<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Page extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'site_id',
        'branch_id',
        'parent_id',
        'title',
        'icon',
        'slug',
        'content',
        'order',
        'logical_id',
    ];

    protected $casts = [
        'content' => 'array',
        'order' => 'integer',
    ];

    protected static function booted(): void
    {
        static::creating(function (Page $page) {
            if (empty($page->slug)) {
                $baseSlug = Str::slug($page->title);
                $slug = $baseSlug;
                $counter = 1;

                // Unique slug per site and branch
                while (Page::where('site_id', $page->site_id)
                    ->where('branch_id', $page->branch_id)
                    ->where('slug', $slug)
                    ->exists()) {
                    $slug = $baseSlug . '-' . $counter;
                    $counter++;
                }

                $page->slug = $slug;
            }
        });
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    /**
     * Resolve the model by slug or UUID (id).
     */
    public function resolveRouteBinding($value, $field = null): ?self
    {
        return $this->where('slug', $value)
            ->orWhere('id', $value)
            ->first();
    }

    /**
     * The site this page belongs to
     */
    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
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
     * Recursive relationship for children's children
     */
    public function allChildren(): HasMany
    {
        return $this->children()->with('allChildren');
    }

    /**
     * Commit history for this page
     */
    public function commitPages(): HasMany
    {
        return $this->hasMany(CommitPage::class)->orderByDesc('created_at');
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
        if (! $this->content) {
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
