<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$site = App\Models\Site::where('slug', 'ceisa-40-official')->first();
if (!$site) {
    echo "Site not found\n";
    exit;
}

$pages = App\Models\Page::where('site_id', $site->id)->get();
$cleanedCount = 0;

foreach($pages as $page) {
    if (!$page->content || !isset($page->content['content'])) continue;
    $content = $page->content;
    
    $nodes = $content['content'];
    $changed = false;
    
    while (count($nodes) > 0) {
        $lastIdx = count($nodes) - 1;
        $lastNode = $nodes[$lastIdx];
        
        if ($lastNode['type'] !== 'paragraph') {
            // Check if it's horizontal rule?
            if ($lastNode['type'] === 'horizontalRule') {
                array_pop($nodes);
                $changed = true;
                continue;
            }
            break;
        }
        
        $text = '';
        $hasLink = false;
        
        if (isset($lastNode['content'])) {
            foreach($lastNode['content'] as $tNode) {
                if (isset($tNode['text'])) {
                    $text .= $tNode['text'];
                }
                if (isset($tNode['marks'])) {
                    foreach($tNode['marks'] as $mark) {
                        if ($mark['type'] === 'link') {
                            $hasLink = true;
                        }
                    }
                }
            }
        }
        
        $text = trim($text);
        $shouldRemove = false;
        
        if (empty($text)) {
            $shouldRemove = true; // Remove trailing empty paragraphs
        } else if (preg_match('/^Last updated /', $text)) {
            $shouldRemove = true; // Remove the trailing "Last updated X ago"
        } else if (preg_match('/^(Previous|Next)/i', $text) && $hasLink && strlen($text) < 150) {
            $shouldRemove = true; // Remove the footer Next/Prev buttons
        }
        
        if ($shouldRemove) {
            array_pop($nodes);
            $changed = true;
        } else {
            break;
        }
    }
    
    // Sometimes there's a horizontal rule left over after deleting the footer
    if (count($nodes) > 0 && $nodes[count($nodes) - 1]['type'] === 'horizontalRule') {
        array_pop($nodes);
        $changed = true;
    }
    
    if ($changed) {
        $content['content'] = $nodes;
        $page->content = $content;
        $page->save();
        $cleanedCount++;
    }
}

echo "Cleaned $cleanedCount pages.\n";
