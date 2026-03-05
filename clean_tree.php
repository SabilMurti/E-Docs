<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$site = App\Models\Site::where('slug', 'ceisa-40-official')->first();

$pages = App\Models\Page::where('site_id', $site->id)->get();

$rootId = null;

// Find the very top page
foreach($pages as $page) {
    if (trim($page->title) === 'CEISA 4.0 | Portal-CEISA40') {
        $rootId = $page->id;
        break;
    }
}

// 1. Strip the " | Portal-CEISA40" suffix from ALL pages
foreach($pages as $page) {
    $cleanTitle = str_replace(' | Portal-CEISA40', '', $page->title);
    if ($cleanTitle !== $page->title) {
        $page->title = trim($cleanTitle);
        // Maybe also update slug by regenerating it, or just leave it
        $page->save();
    }
}

// 2. Un-nest all direct children of the root page
if ($rootId) {
    echo "Found root node ID: $rootId\n";
    $children = App\Models\Page::where('parent_id', $rootId)->get();
    echo "Promoting " . count($children) . " pages to root level...\n";
    foreach($children as $child) {
        $child->parent_id = null;
        $child->save();
    }
}

echo "Done fixing tree structure and titles.\n";
