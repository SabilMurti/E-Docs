<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$page = \App\Models\Page::where('slug', 'pendaftaran-baru')->where('site_id', '019c7e13-675f-728e-9fa9-64c0c533c7a3')->first();
if ($page) {
    if (empty($page->content)) {
        $page->update([
            'content' => [
                'type' => 'doc', 
                'content' => [
                    ['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'This is test text for pendaftaran baru.']]]
                ]
            ]
        ]);
        echo "Updated page.\n";
    }
} else {
    echo "Page not found.\n";
}
