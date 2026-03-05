<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$r = new \Illuminate\Http\Request;
$r->replace([
    'source_branch_id' => '019c98f0-eaff-7104-928f-78067947a6bf',
    'target_branch_id' => '019c984d-fb41-7004-98c5-b771cbc50476'
]);
$user = \App\Models\User::first();
$r->setUserResolver(function() use ($user) { return $user; });

$ctrl = app(\App\Http\Controllers\Api\PullRequestController::class);
try {
    $out = $ctrl->compare($r, \App\Models\Site::find('019c984d-fb10-71db-8552-8e495beff785'));
    echo json_encode($out->getData());
} catch (\Exception $e) {
    echo $e->getMessage();
}
