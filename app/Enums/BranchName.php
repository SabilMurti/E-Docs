<?php

namespace App\Enums;

/**
 * Branch name constants
 */
final class BranchName
{
    /**
     * Default branch name (reserved)
     */
    public const DEFAULT = 'main';

    /**
     * Alternative default branch name (commonly used)
     */
    public const MASTER = 'master';

    /**
     * Get default branch names
     */
    public static function defaults(): array
    {
        return [
            self::DEFAULT,
            self::MASTER,
        ];
    }

    /**
     * Check if branch name is reserved
     */
    public static function isReserved(string $name): bool
    {
        return in_array($name, self::defaults());
    }
}
