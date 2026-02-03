<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class SpaceMember extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'space_id',
        'user_id',
        'email',
        'role',
        'status',
        'invite_token',
        'invited_at',
        'accepted_at',
    ];

    protected $casts = [
        'invited_at' => 'datetime',
        'accepted_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (SpaceMember $member) {
            if (empty($member->invite_token) && $member->status === 'pending') {
                $member->invite_token = Str::random(64);
            }
            if (empty($member->invited_at)) {
                $member->invited_at = now();
            }
        });
    }

    /**
     * The space this membership belongs to
     */
    public function space(): BelongsTo
    {
        return $this->belongsTo(Space::class);
    }

    /**
     * The user (if registered and accepted)
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Accept the invitation
     */
    public function accept(User $user): void
    {
        $this->update([
            'user_id' => $user->id,
            'status' => 'accepted',
            'accepted_at' => now(),
            'invite_token' => null,
        ]);
    }

    /**
     * Check if this is a pending invite
     */
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }
}
