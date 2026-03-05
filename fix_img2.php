<?php
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
    
    // Using a simpler approach: replace className="..." /> with className="..." referrerPolicy="no-referrer" />
    $modified = preg_replace('/(<img[^>]*src=\{[^>]*avatar_url\}[^>]*?)(?:\s*\/>)/is', '$1 referrerPolicy="no-referrer" />', $content);
    
    if ($content !== $modified) {
        file_put_contents($file, $modified);
        echo "Updated $file\n";
    }
}
