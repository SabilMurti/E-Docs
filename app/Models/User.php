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
        return $this->hasMany(Commit::class);
    }
}
