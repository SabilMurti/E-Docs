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
     * Spaces owned by this user
     */
    public function ownedSpaces(): HasMany
    {
        return $this->hasMany(Space::class);
    }

    /**
     * Spaces the user is a member of (including owned)
     */
    public function spaces(): BelongsToMany
    {
        return $this->belongsToMany(Space::class, 'space_members')
            ->withPivot(['role', 'status'])
            ->withTimestamps();
    }

    /**
     * Space memberships
     */
    public function spaceMemberships(): HasMany
    {
        return $this->hasMany(SpaceMember::class);
    }

    /**
     * Page revisions authored by this user
     */
    public function pageRevisions(): HasMany
    {
        return $this->hasMany(PageRevision::class);
    }
}
