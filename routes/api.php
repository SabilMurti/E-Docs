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
    // Google - Rate limited
    Route::middleware('throttle:10,1')->group(function () {
        Route::get('google', [AuthController::class, 'redirectToGoogle']);
        Route::get('google/callback', [AuthController::class, 'handleGoogleCallback']);

        // GitHub - Rate limited
        Route::get('github', [AuthController::class, 'redirectToGithub']);
        Route::get('github/callback', [AuthController::class, 'handleGithubCallback']);
    });

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
    Route::post('sites/{site}/republish', [SiteController::class, 'republish']);

    // Site Members (Collaboration)
    Route::get('sites/{site}/members', [SiteMemberController::class, 'index']);
    Route::post('sites/{site}/members', [SiteMemberController::class, 'store']);
    Route::put('sites/{site}/members/{userId}', [SiteMemberController::class, 'updateRole']);
    Route::delete('sites/{site}/members/{userId}', [SiteMemberController::class, 'destroy']);

    // Branches
    Route::get('sites/{site}/branches', [\App\Http\Controllers\Api\BranchController::class, 'index']);
    Route::post('sites/{site}/branches', [\App\Http\Controllers\Api\BranchController::class, 'store']);
    Route::delete('sites/{site}/branches/{branch}', [\App\Http\Controllers\Api\BranchController::class, 'destroy']);

    // Pull Requests (GitHub-like)
    Route::get('sites/{site}/pulls', [\App\Http\Controllers\Api\PullRequestController::class, 'index']);
    Route::post('sites/{site}/pulls', [\App\Http\Controllers\Api\PullRequestController::class, 'store']);
    Route::get('sites/{site}/pulls/compare', [\App\Http\Controllers\Api\PullRequestController::class, 'compare']);
    Route::get('sites/{site}/pulls/{pullRequest}', [\App\Http\Controllers\Api\PullRequestController::class, 'show']);
    Route::put('sites/{site}/pulls/{pullRequest}', [\App\Http\Controllers\Api\PullRequestController::class, 'update']);
    Route::post('sites/{site}/pulls/{pullRequest}/merge', [\App\Http\Controllers\Api\PullRequestController::class, 'merge']);
    Route::post('sites/{site}/pulls/{pullRequest}/resolve', [\App\Http\Controllers\Api\PullRequestController::class, 'resolve']);
    Route::post('sites/{site}/pulls/{pullRequest}/close', [\App\Http\Controllers\Api\PullRequestController::class, 'close']);
    Route::delete('sites/{site}/pulls/{pullRequest}', [\App\Http\Controllers\Api\PullRequestController::class, 'destroy']);

    // Pull Request Reviews
    Route::get('sites/{site}/pulls/{pullRequest}/reviews', [\App\Http\Controllers\Api\PullRequestReviewController::class, 'index']);
    Route::post('sites/{site}/pulls/{pullRequest}/reviews', [\App\Http\Controllers\Api\PullRequestReviewController::class, 'store']);

    // Page-specific Requests (for editor integration)
    Route::get('pages/{page}/requests', [\App\Http\Controllers\Api\PullRequestController::class, 'indexByPage']);
    Route::post('pages/{page}/requests', [\App\Http\Controllers\Api\PullRequestController::class, 'storePageRequest']);

    // Global Request Routes (for components that only have requestId)
    Route::get('requests/{pullRequest}', [\App\Http\Controllers\Api\PullRequestController::class, 'showFull']);
    Route::post('requests/{pullRequest}/merge', [\App\Http\Controllers\Api\PullRequestController::class, 'mergeFull']);
    Route::get('requests/{pullRequest}/commits', [\App\Http\Controllers\Api\PullRequestController::class, 'commits']);
    Route::post('requests/{pullRequest}/sync', [\App\Http\Controllers\Api\PullRequestController::class, 'sync']);

    // Commits (Site-level)
    Route::get('sites/{site}/commits', [\App\Http\Controllers\Api\CommitController::class, 'index']);
    Route::post('sites/{site}/commits', [\App\Http\Controllers\Api\CommitController::class, 'store']);
    Route::post('sites/{site}/pages/{page}/commits', [\App\Http\Controllers\Api\CommitController::class, 'storePage']);
    Route::get('sites/{site}/commits/{commit}', [\App\Http\Controllers\Api\CommitController::class, 'show']);

    // Pages
    Route::post('sites/{site}/pages', [PageController::class, 'store']);
    Route::get('sites/{site}/pages', [PageController::class, 'index']);
    Route::get('sites/{site}/pages/{page}', [PageController::class, 'show']);
    Route::put('sites/{site}/pages/{page}', [PageController::class, 'update']);
    Route::delete('sites/{site}/pages/{page}', [PageController::class, 'destroy']);
    Route::post('sites/{site}/pages/reorder', [PageController::class, 'reorder']);

    // Notifications
    Route::get('notifications', [\App\Http\Controllers\Api\NotificationController::class, 'index']);
    Route::get('notifications/count', [\App\Http\Controllers\Api\NotificationController::class, 'unreadCount']);
    Route::post('notifications/{id}/read', [\App\Http\Controllers\Api\NotificationController::class, 'markAsRead']);
    Route::post('notifications/read-all', [\App\Http\Controllers\Api\NotificationController::class, 'markAllAsRead']);

    // Search - Rate limited
    Route::middleware('throttle:30,1')->get('sites/{site}/search', [SearchController::class, 'search']);

    // Uploads - Rate limited (10 per minute, 50MB total)
    Route::middleware('throttle:10,1')->post('upload', [UploadController::class, 'store']);
});

// Public Routes (supports both slug and UUID)
Route::prefix('public')->group(function () {
    // Public Site routes - Rate limited
    Route::middleware('throttle:60,1')->group(function () {
        Route::get('sites/{identifier}', [PublicSiteController::class, 'show']);
        Route::get('sites/{identifier}/pages/{pageSlug}', [PublicSiteController::class, 'page']);
        Route::get('sites/{identifier}/search', [PublicSiteController::class, 'search']);
    });
});
