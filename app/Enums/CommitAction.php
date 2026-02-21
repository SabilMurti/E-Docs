<?php

namespace App\Enums;

/**
 * Commit action types
 */
enum CommitAction: string
{
    case ADDED = 'added';
    case MODIFIED = 'modified';
    case DELETED = 'deleted';
    case MOVED = 'moved';
    case RENAMED = 'renamed';
}
