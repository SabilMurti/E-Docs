<?php

namespace App\Models;

use App\Enums\UserRole;
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

    protected $appends = ['can_edit', 'can_merge', 'can_admin', 'user_role'];

    protected $casts = [
        'settings' => 'array',
        'is_published' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::creating(function (Site $site) {
            if (empty($site->slug)) {
                $baseSlug = Str::slug($site->name);
                $slug = $baseSlug;
                $counter = 1;

                // Check if slug exists, if so append number
                while (Site::where('slug', $slug)->exists()) {
                    $slug = $baseSlug . '-' . $counter;
                    $counter++;
                }

                $site->slug = $slug;
            }
        });
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
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
     * Branches in this site
     */
    public function branches(): HasMany
    {
        return $this->hasMany(Branch::class);
    }

    /**
     * Get root pages (no parent)
     */
    public function rootPages(): HasMany
    {
        return $this->pages()->whereNull('parent_id');
    }

    /**
     * Pull requests in this site
     */
    public function pullRequests(): HasMany
    {
        return $this->hasMany(PullRequest::class);
    }

    /**
     * Commits in this site
     */
    public function commits(): HasMany
    {
        return $this->hasMany(Commit::class);
    }

    /**
     * Members of this site
     */
    public function members()
    {
        return $this->belongsToMany(User::class, 'site_members')
            ->using(SiteMember::class)
            ->withPivot('role')
            ->withTimestamps();
    }

    public function getPublicUrlAttribute(): string
    {
        return url("/public/{$this->slug}");
    }

    /**
     * Get user's role in this site
     */
    public function getUserRole(User $user): ?string
    {
        if ($this->user_id === $user->id) {
            return 'owner';
        }

        $member = $this->members()->where('user_id', $user->id)->first();
        return $member?->pivot?->role;
    }

    /**
     * Check if user can view this site (all roles)
     */
    public function canView(User $user): bool
    {
        if ($this->user_id === $user->id) {
            return true;
        }

        return $this->members()->where('user_id', $user->id)->exists();
    }

    /**
     * Check if user can write (edit pages, create branches/PRs)
     * Roles: owner, admin, maintain, write
     */
    public function canWrite(User $user): bool
    {
        if ($this->user_id === $user->id) {
            return true;
        }

        return $this->members()
            ->where('user_id', $user->id)
            ->whereIn('role', UserRole::writeRoles())
            ->exists();
    }

    /**
     * Check if user can edit this site (alias for canWrite)
     */
    public function canEdit(User $user): bool
    {
        return $this->canWrite($user);
    }

    /**
     * Check if user can maintain (merge PRs)
     * Roles: owner, admin, maintain
     */
    public function canMaintain(User $user): bool
    {
        if ($this->user_id === $user->id) {
            return true;
        }

        return $this->members()
            ->where('user_id', $user->id)
            ->whereIn('role', UserRole::maintainRoles())
            ->exists();
    }

    /**
     * Check if user can admin (manage members, settings)
     * Roles: owner, admin
     */
    public function canAdmin(User $user): bool
    {
        if ($this->user_id === $user->id) {
            return true;
        }

        return $this->members()
            ->where('user_id', $user->id)
            ->whereIn('role', UserRole::adminRoles())
            ->exists();
    }

    /**
     * Frontend helpers
     */
    public function getCanEditAttribute(): bool
    {
        $user = auth()->user();
        if (!$user) return false;
        return $this->canWrite($user);
    }

    public function getCanMergeAttribute(): bool
    {
        $user = auth()->user();
        if (!$user) return false;
        return $this->canMaintain($user);
    }

    public function getCanAdminAttribute(): bool
    {
        $user = auth()->user();
        if (!$user) return false;
        return $this->canAdmin($user);
    }

    public function getUserRoleAttribute(): ?string
    {
        $user = auth()->user();
        if (!$user) return null;
        return $this->getUserRole($user);
    }
}
