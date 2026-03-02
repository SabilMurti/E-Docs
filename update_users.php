<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$users = \App\Models\User::whereNotNull('google_id')->get();
foreach ($users as $u) {
    echo $u->name . " -> " . $u->avatar_url . "\n";
}
