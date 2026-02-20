<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, HasUuids, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'avatar_url',
        'google_id',
        'github_id',
    ];

    protected $hidden = [
        'google_id',
        'github_id',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
        ];
    }

    /**
     * Sites owned by this user
     */
    public function ownedSites(): HasMany
    {
        return $this->hasMany(Site::class);
    }

    /**
     * Sites the user is a member of (including owned if added as member)
     */
    public function sites(): BelongsToMany
    {
        return $this->belongsToMany(Site::class, 'site_members')
            ->withPivot(['role'])
            ->withTimestamps();
    }

    /**
     * Commits authored by this user
     */
    public function commits(): HasMany
    {
        return $this->hasMany(Commit::class, 'user_id');
    }

    /**
     * Pull requests authored by this user
     */
    public function authoredPullRequests(): HasMany
    {
        return $this->hasMany(PullRequest::class, 'author_id');
    }

    /**
     * Pull requests merged by this user
     */
    public function mergedPullRequests(): HasMany
    {
        return $this->hasMany(PullRequest::class, 'merged_by');
    }

    /**
     * Reviews written by this user
     */
    public function reviews(): HasMany
    {
        return $this->hasMany(PullRequestReview::class, 'user_id');
    }
}
