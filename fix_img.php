<?php
// Just doing a search/replace script because it's easier than trying to use replace_file_content 4 times inline 
$files = [
    'frontend/src/components/layout/Navbar.jsx',
    'frontend/src/components/layout/UnifiedSidebar.jsx',
    'frontend/src/components/layout/GlobalSidebar.jsx',
    'frontend/src/components/members/MemberList.jsx',
    'frontend/src/components/pages/PullRequestsPage.jsx',
    'frontend/src/components/sites/SiteMembers.jsx'
];

foreach ($files as $file) {
    if (!file_exists($file)) continue;
    $content = file_get_contents($file);
    
    // Add referrerPolicy="no-referrer" to all img tags rendering avatar_url
    $modified = preg_replace('/(<img[^>]*src=\{([^\}]+avatar_url)\}[^>]*)(?<!referrerPolicy="no-referrer")([^>]*)>/i', '$1 referrerPolicy="no-referrer"$3>', $content);
    
    // Alternative match pattern for multi-line img tags
    if ($content !== $modified) {
        file_put_contents($file, $modified);
        echo "Updated $file\n";
    } else {
        // More robust replacements for multi-line
        $modified2 = preg_replace('/(<img\s+[^>]*src=\{[^>]*avatar_url\}[^>]*?)(?:\s*)?(\/?>)/s', '$1 referrerPolicy="no-referrer" $2', $content);
        if ($content !== $modified2) {
            file_put_contents($file, $modified2);
            echo "Updated $file (multiline)\n";
        } else {
            echo "No change needed in $file\n";
        }
    }
}
