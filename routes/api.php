<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\SpaceController;
use App\Http\Controllers\Api\SpaceMemberController;
use App\Http\Controllers\Api\PageController;
use App\Http\Controllers\Api\PageRevisionController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\PublicSpaceController;
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
    // Spaces
    Route::apiResource('spaces', SpaceController::class);
    Route::post('spaces/{space}/publish', [SpaceController::class, 'publish']);
    Route::post('spaces/{space}/unpublish', [SpaceController::class, 'unpublish']);
    
    // Space Members
    Route::get('spaces/{space}/members', [SpaceMemberController::class, 'index']);
    Route::post('spaces/{space}/members', [SpaceMemberController::class, 'store']);
    Route::put('spaces/{space}/members/{member}', [SpaceMemberController::class, 'update']);
    Route::delete('spaces/{space}/members/{member}', [SpaceMemberController::class, 'destroy']);
    
    // Pages
    Route::get('spaces/{space}/pages', [PageController::class, 'index']);
    Route::post('spaces/{space}/pages', [PageController::class, 'store']);
    Route::get('spaces/{space}/pages/{page}', [PageController::class, 'show']);
    Route::put('spaces/{space}/pages/{page}', [PageController::class, 'update']);
    Route::delete('spaces/{space}/pages/{page}', [PageController::class, 'destroy']);
    Route::post('spaces/{space}/pages/reorder', [PageController::class, 'reorder']);
    
    // Page Revisions
    Route::get('spaces/{space}/pages/{page}/revisions', [PageRevisionController::class, 'index']);
    Route::get('spaces/{space}/pages/{page}/revisions/{revision}', [PageRevisionController::class, 'show']);
    Route::post('spaces/{space}/pages/{page}/revisions/{revision}/restore', [PageRevisionController::class, 'restore']);
    
    // Search
    Route::get('spaces/{space}/search', [SearchController::class, 'search']);
});

// Public Routes
Route::prefix('public')->group(function () {
    Route::get('spaces/{slug}', [PublicSpaceController::class, 'show']);
    Route::get('spaces/{slug}/pages', [PublicSpaceController::class, 'pages']);
    Route::get('spaces/{slug}/pages/{pageSlug}', [PublicSpaceController::class, 'page']);
});

// Invites
Route::post('spaces/{space}/invites/{token}/accept', [SpaceMemberController::class, 'acceptInvite'])->middleware('auth:sanctum');
