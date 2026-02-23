<?php

namespace App\Enums;

/**
 * Pull request statuses
 */
enum PullRequestStatus: string
{
    case DRAFT = 'draft';
    case OPEN = 'open';
    case MERGED = 'merged';
    case CLOSED = 'closed';
    case CONFLICT = 'conflict';

    /**
     * Get active statuses (can still be worked on)
     */
    public static function activeStatuses(): array
    {
        return [
            self::DRAFT,
            self::OPEN,
            self::CONFLICT,
        ];
    }

    /**
     * Get closed statuses (final state)
     */
    public static function closedStatuses(): array
    {
        return [
            self::MERGED,
            self::CLOSED,
        ];
    }

    /**
     * Check if PR can be merged
     */
    public function canMerge(): bool
    {
        return $this === self::OPEN;
    }

    /**
     * Check if PR is still open for changes
     */
    public function isActive(): bool
    {
        return in_array($this, self::activeStatuses());
    }
}
