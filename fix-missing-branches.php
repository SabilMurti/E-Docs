#!/usr/bin/env php
<?php

/**
 * Script to Add Missing 'main' Branch to Existing Sites
 * 
 * This script checks all sites and creates a 'main' branch if one doesn't exist.
 * This fixes the issue where old sites were created without a default branch.
 * 
 * Usage: php fix-missing-branches.php
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Site;
use App\Models\User;

echo "🔧 Checking for sites without 'main' branch...\n\n";

$sites = Site::with('branches')->get();
$fixed = 0;
$skipped = 0;

foreach ($sites as $site) {
    $hasMainBranch = $site->branches->contains('name', 'main');

    if (!$hasMainBranch) {
        echo "⚠️  Site '{$site->name}' (ID: {$site->id}) is missing 'main' branch\n";

        // Create 'main' branch
        $site->branches()->create([
            'name' => 'main',
            'is_default' => true,
            'created_by' => $site->user_id, // Use site owner as creator
        ]);

        echo "   ✅ Created 'main' branch\n";
        $fixed++;
    } else {
        echo "✓  Site '{$site->name}' already has 'main' branch\n";
        $skipped++;
    }
}

echo "\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "✅ Fixed: {$fixed} site(s)\n";
echo "⏭️  Skipped: {$skipped} site(s)\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "\n";

if ($fixed > 0) {
    echo "🎉 Success! You can now create pages in all sites.\n";
} else {
    echo "✨ All sites already have 'main' branch. Nothing to fix!\n";
}
