<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$site = App\Models\Site::where('slug', 'ceisa-40-official')->first();

$icons = [
    'Portal Pengguna Jasa' => '🛡️',
    'Registrasi Pabean' => '🔏',
    'Portal Impor - BC 2.0' => '📔',
    'Portal - BC 2.4' => '📙',
    'Portal TPB' => '📘',
    'Portal Ekspor' => '📗',
    'Pengajuan Rush Handling' => '📁',
    'Portal Manifes' => '🚢',
    'Perbendaharaan' => '🏛️',
    'Keberatan dan Banding' => '⚖️',
    'Portal Barang Kiriman' => '📦',
    'Ekspor Barang Kiriman' => '📤',
    'Voluntary Declaration (VD)' => '📝',
    'Permohonan Carnet' => '📰'
];

foreach ($icons as $title => $icon) {
    App\Models\Page::where('site_id', $site->id)
        ->where('title', $title)
        ->update(['icon' => $icon]);
}

// Rename Root from "CEISA 4.0" to "Beranda" and set icon so it doesn't look like a folder
$rootPage = App\Models\Page::where('site_id', $site->id)->where('title', 'CEISA 4.0')->first();
if ($rootPage) {
    if (!$rootPage->icon) {
        $rootPage->icon = '🏠'; // Or something
        $rootPage->save();
    }
}

echo "Icons inserted.\n";
