<?php

namespace App\Enums;

/**
 * User roles within a site
 */
enum UserRole: string
{
    case OWNER = 'owner';
    case ADMIN = 'admin';
    case MAINTAIN = 'maintain';
    case WRITE = 'write';
    case READ = 'read';

    /**
     * Get all role values as strings
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Get roles that can view content
     */
    public static function viewRoles(): array
    {
        return [
            self::OWNER,
            self::ADMIN,
            self::MAINTAIN,
            self::WRITE,
            self::READ,
        ];
    }

    /**
     * Get roles that can write/edit content
     */
    public static function writeRoles(): array
    {
        return [
            self::OWNER,
            self::ADMIN,
            self::MAINTAIN,
            self::WRITE,
        ];
    }

    /**
     * Get roles that can maintain (merge PRs)
     */
    public static function maintainRoles(): array
    {
        return [
            self::OWNER,
            self::ADMIN,
            self::MAINTAIN,
        ];
    }

    /**
     * Get roles that can admin (manage members, settings)
     */
    public static function adminRoles(): array
    {
        return [
            self::OWNER,
            self::ADMIN,
        ];
    }

    /**
     * Check if role can write
     */
    public function canWrite(): bool
    {
        return in_array($this, self::writeRoles());
    }

    /**
     * Check if role can maintain
     */
    public function canMaintain(): bool
    {
        return in_array($this, self::maintainRoles());
    }

    /**
     * Check if role can admin
     */
    public function canAdmin(): bool
    {
        return in_array($this, self::adminRoles());
    }
}
