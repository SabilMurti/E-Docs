<?php

namespace App\Enums;

/**
 * Pull request review statuses
 */
enum PullRequestReviewStatus: string
{
    case PENDING = 'pending';
    case APPROVED = 'approved';
    case CHANGES_REQUESTED = 'changes_requested';
    case COMMENTED = 'commented';

    /**
     * Check if review is final (submitted)
     */
    public function isSubmitted(): bool
    {
        return $this !== self::PENDING;
    }

    /**
     * Check if review is approval
     */
    public function isApproved(): bool
    {
        return $this === self::APPROVED;
    }

    /**
     * Check if review requested changes
     */
    public function changesRequested(): bool
    {
        return $this === self::CHANGES_REQUESTED;
    }
}
