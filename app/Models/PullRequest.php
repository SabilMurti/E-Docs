<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PullRequest extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'site_id',
        'source_branch_id',
        'target_branch_id',
        'author_id',
        'number',
        'title',
        'description',
        'status',
        'merged_by',
        'merged_at',
        'closed_at',
    ];

    protected $casts = [
        'merged_at' => 'datetime',
        'closed_at' => 'datetime',
        'number' => 'integer',
    ];

    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }

    public function sourceBranch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'source_branch_id');
    }

    public function targetBranch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'target_branch_id');
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function mergedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'merged_by');
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(PullRequestReview::class)->orderByDesc('created_at');
    }

    public function latestReviews()
    {
        return $this->reviews()
            ->select('pull_request_reviews.*')
            ->whereIn('id', function ($query) {
                $query->selectRaw('MAX(id)')
                    ->from('pull_request_reviews')
                    ->where('pull_request_id', $this->id)
                    ->groupBy('user_id');
            });
    }

    public function isApproved(): bool
    {
        // Get latest review per user (one review per user)
        $latestReviews = $this->reviews
            ->sortByDesc('created_at')
            ->unique('user_id');

        if ($latestReviews->isEmpty()) {
            return false;
        }

        return $latestReviews->every(fn($r) => $r->status === 'approved');
    }

    public function hasChangesRequested(): bool
    {
        // Get latest review per user and check if any requested changes
        $latestReviews = $this->reviews
            ->sortByDesc('created_at')
            ->unique('user_id');

        return $latestReviews->contains(fn($r) => $r->status === 'changes_requested');
    }

    public static function nextNumber(string $siteId): int
    {
        return (self::where('site_id', $siteId)->max('number') ?? 0) + 1;
    }
}
