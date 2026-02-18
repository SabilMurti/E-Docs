<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Commit extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'site_id',
        'branch_id',
        'user_id',
        'message',
        'hash',
    ];

    protected static function booted(): void
    {
        static::creating(function (Commit $commit) {
            if (empty($commit->hash)) {
                $commit->hash = substr(Str::uuid()->getHex(), 0, 40);
            }
        });
    }

    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function pages(): HasMany
    {
        return $this->hasMany(CommitPage::class);
    }

    public function getShortHashAttribute(): string
    {
        return substr($this->hash, 0, 7);
    }
}
