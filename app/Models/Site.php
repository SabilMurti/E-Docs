<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Site extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'user_id',
        'name',
        'slug',
        'description',
        'logo_url',
        'settings',
        'is_published',
    ];

    protected $casts = [
        'settings' => 'array',
        'is_published' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::creating(function (Site $site) {
            if (empty($site->slug)) {
                $site->slug = Str::slug($site->name) . '-' . Str::random(6);
            }
        });
    }

    /**
     * Owner of this site
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Spaces in this site
     */
    /**
     * Pages in this site
     */
    public function pages(): HasMany
    {
        return $this->hasMany(Page::class)->orderBy('order');
    }

    /**
     * Get root pages (no parent)
     */
    public function rootPages(): HasMany
    {
        return $this->pages()->whereNull('parent_id');
    }

    /**
     * Check if user can view this site
     */
    /**
     * Members of this site
     */
    public function members()
    {
        return $this->belongsToMany(User::class, 'site_members')
            ->using(SiteMember::class)
            ->withPivot('role', 'id')
            ->withTimestamps();
    }

    /**
     * Check if user can view this site (Dashboard access)
     */
    public function canView(User $user): bool
    {
        if ($this->user_id === $user->id) {
            return true;
        }

        return $this->members()->where('user_id', $user->id)->exists();
    }

    /**
     * Check if user can edit this site
     */
    public function canEdit(User $user): bool
    {
        if ($this->user_id === $user->id) {
            return true;
        }

        return $this->members()
            ->where('user_id', $user->id)
            ->whereIn('role', ['admin', 'editor'])
            ->exists();
    }

    /**
     * Get public URL
     */
    public function getPublicUrlAttribute(): string
    {
        return url("/public/{$this->id}");
    }
}
