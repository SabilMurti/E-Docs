<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\SiteController;
use App\Http\Controllers\Api\PageController;
use App\Http\Controllers\Api\PageRevisionController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\PublicSiteController;
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

    // Search
    Route::get('sites/{site}/search', [SearchController::class, 'search']);
});

// Public Routes (supports both slug and UUID)
Route::prefix('public')->group(function () {
    // Public Site routes
    Route::get('sites/{identifier}', [PublicSiteController::class, 'show']);

    // Updated public routes structure... (TODO: Update PublicSiteController)
    // Route::get('sites/{identifier}/pages', [PublicSiteController::class, 'pages']);
    // Route::get('sites/{identifier}/pages/{pageId}', [PublicSiteController::class, 'page']);
});
