<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\SiteController;
use App\Http\Controllers\Api\PageController;
use App\Http\Controllers\Api\PageRevisionController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\PublicSiteController;
use App\Http\Controllers\Api\SiteMemberController;
use App\Http\Controllers\Api\UploadController;
use Illuminate\Support\Facades\Route;

// Auth Routes
Route::prefix('auth')->group(function () {
    // Google
    Route::get('google', [AuthController::class, 'redirectToGoogle']);
    Route::get('google/callback', [AuthController::class, 'handleGoogleCallback']);

    // GitHub
    Route::get('github', [AuthController::class, 'redirectToGithub']);
    Route::get('github/callback', [AuthController::class, 'handleGithubCallback']);

    // Protected Auth
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);
    });
});

// Protected API Routes
Route::middleware('auth:sanctum')->group(function () {
    // Sites
    Route::apiResource('sites', SiteController::class);
    Route::post('sites/{site}/publish', [SiteController::class, 'publish']);

    Route::post('sites/{site}/unpublish', [SiteController::class, 'unpublish']);

    // Site Members (Collaboration)
    Route::get('sites/{site}/members', [SiteMemberController::class, 'index']);
    Route::post('sites/{site}/members', [SiteMemberController::class, 'store']);
    Route::delete('sites/{site}/members/{userId}', [SiteMemberController::class, 'destroy']);

    // Pages (Directly under Sites now)
    Route::post('sites/{site}/pages', [PageController::class, 'store']);
    Route::get('sites/{site}/pages', [PageController::class, 'index']);
    Route::get('sites/{site}/pages/{page}', [PageController::class, 'show']);
    Route::put('sites/{site}/pages/{page}', [PageController::class, 'update']);
    Route::delete('sites/{site}/pages/{page}', [PageController::class, 'destroy']);
    Route::post('sites/{site}/pages/reorder', [PageController::class, 'reorder']);

    // Page Revisions
    Route::get('sites/{site}/pages/{page}/revisions', [PageRevisionController::class, 'index']);
    Route::get('sites/{site}/pages/{page}/revisions/{revision}', [PageRevisionController::class, 'show']);
    Route::post('sites/{site}/pages/{page}/revisions/{revision}/restore', [PageRevisionController::class, 'restore']);

    // Change Requests (Drafts & PRs)
    Route::get('pages/{page}/requests', [\App\Http\Controllers\PageChangeRequestController::class, 'index']);
    Route::post('pages/{page}/requests', [\App\Http\Controllers\PageChangeRequestController::class, 'store']);
    Route::get('requests/{changeRequest}', [\App\Http\Controllers\PageChangeRequestController::class, 'show']);
    Route::post('requests/{changeRequest}/merge', [\App\Http\Controllers\PageChangeRequestController::class, 'merge']);
    Route::post('requests/{changeRequest}/sync', [\App\Http\Controllers\PageChangeRequestController::class, 'sync']);

    // Page Commits (History)
    Route::post('sites/{site}/pages/{page}/commits', [\App\Http\Controllers\Api\PageCommitController::class, 'store']);
    Route::get('sites/{site}/pages/{page}/commits', [\App\Http\Controllers\Api\PageCommitController::class, 'index']); // Changed from requests/{changeRequest}/commits
    Route::get('requests/{changeRequest}/commits', [\App\Http\Controllers\Api\PageCommitController::class, 'indexByRequest']); // Add specific request lookup if needed

    // Notifications
    Route::get('notifications', [\App\Http\Controllers\Api\NotificationController::class, 'index']);
    Route::get('notifications/count', [\App\Http\Controllers\Api\NotificationController::class, 'unreadCount']);
    Route::post('notifications/{id}/read', [\App\Http\Controllers\Api\NotificationController::class, 'markAsRead']);
    Route::post('notifications/read-all', [\App\Http\Controllers\Api\NotificationController::class, 'markAllAsRead']);

    // Search
    Route::get('sites/{site}/search', [SearchController::class, 'search']);

    // Uploads
    Route::post('upload', [UploadController::class, 'store']);
});

// Public Routes (supports both slug and UUID)
Route::prefix('public')->group(function () {
    // Public Site routes
    Route::get('sites/{identifier}', [PublicSiteController::class, 'show']);
    Route::get('sites/{identifier}/pages/{pageId}', [PublicSiteController::class, 'page']);
});
