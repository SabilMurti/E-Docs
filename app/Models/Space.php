<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Space extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'name',
        'slug',
        'description',
        'visibility',
        'is_published',
    ];

    protected $casts = [
        'is_published' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::creating(function (Space $space) {
            if (empty($space->slug)) {
                $space->slug = Str::slug($space->name);
            }
        });
    }

    /**
     * Owner of this space
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * All pages in this space
     */
    public function pages(): HasMany
    {
        return $this->hasMany(Page::class);
    }

    /**
     * Root pages (no parent)
     */
    public function rootPages(): HasMany
    {
        return $this->hasMany(Page::class)->whereNull('parent_id')->orderBy('order');
    }

    /**
     * Space memberships
     */
    public function memberships(): HasMany
    {
        return $this->hasMany(SpaceMember::class);
    }

    /**
     * Members of this space
     */
    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'space_members')
            ->withPivot(['role', 'status'])
            ->withTimestamps();
    }

    /**
     * Check if user can view this space
     */
    public function canView(User $user): bool
    {
        if ($this->user_id === $user->id) {
            return true;
        }

        return $this->memberships()
            ->where('user_id', $user->id)
            ->where('status', 'accepted')
            ->exists();
    }

    /**
     * Check if user can edit this space
     */
    public function canEdit(User $user): bool
    {
        if ($this->user_id === $user->id) {
            return true;
        }

        return $this->memberships()
            ->where('user_id', $user->id)
            ->where('status', 'accepted')
            ->whereIn('role', ['owner', 'editor'])
            ->exists();
    }

    /**
     * Get user's role in this space
     */
    public function getUserRole(User $user): ?string
    {
        if ($this->user_id === $user->id) {
            return 'owner';
        }

        $membership = $this->memberships()
            ->where('user_id', $user->id)
            ->where('status', 'accepted')
            ->first();

        return $membership?->role;
    }
}
