<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * This migration adds missing indexes for better query performance:
     * - pages.branch_id (frequently queried)
     * - pages.logical_id (used in PR diff calculations)
     * - pages.parent_id (for hierarchical queries)
     * - pull_requests composite indexes
     * - commits indexes
     */
    public function up(): void
    {
        Schema::table('pages', function (Blueprint $table) {
            // Index for branch filtering (very common in PageController)
            $table->index('branch_id', 'pages_branch_id_idx');
            
            // Index for logical_id lookups (used in PR diff calculations)
            $table->index('logical_id', 'pages_logical_id_idx');
            
            // Index for parent_id (harchical queries)
            $table->index('parent_id', 'pages_parent_id_idx');
            
            // Composite index for common query pattern: branch + parent + order
            $table->index(['branch_id', 'parent_id', 'order'], 'pages_branch_parent_order_idx');
            
            // Full-text search index for title (if using MySQL)
            if (config('database.default') === 'mysql') {
                $table->fullText('title', 'pages_title_fulltext_idx');
            }
        });

        Schema::table('pull_requests', function (Blueprint $table) {
            // Index for filtering by site and status (common in PR lists)
            $table->index(['site_id', 'status'], 'pull_requests_site_status_idx');
            
            // Index for source and target branch lookups
            $table->index('source_branch_id', 'pull_requests_source_branch_idx');
            $table->index('target_branch_id', 'pull_requests_target_branch_idx');
            
            // Index for author's PRs
            $table->index('author_id', 'pull_requests_author_idx');
        });

        Schema::table('commits', function (Blueprint $table) {
            // Index for branch commits (commit history)
            $table->index(['branch_id', 'created_at'], 'commits_branch_created_idx');
            
            // Index for site commits
            $table->index(['site_id', 'created_at'], 'commits_site_created_idx');
        });

        Schema::table('commit_pages', function (Blueprint $table) {
            // Index for commit's pages
            $table->index('commit_id', 'commit_pages_commit_id_idx');
            
            // Index for page's commit history
            $table->index('page_id', 'commit_pages_page_id_idx');
        });

        Schema::table('pull_request_reviews', function (Blueprint $table) {
            // Index for PR reviews
            $table->index('pull_request_id', 'pr_reviews_pr_id_idx');
            
            // Index for user's reviews
            $table->index('user_id', 'pr_reviews_user_id_idx');
            
            // Composite index for latest review per user per PR
            $table->index(['pull_request_id', 'user_id', 'created_at'], 'pr_reviews_pr_user_idx');
        });

        Schema::table('site_members', function (Blueprint $table) {
            // Index for site members lookup
            $table->index(['site_id', 'role'], 'site_members_site_role_idx');
            
            // Index for user's sites
            $table->index('user_id', 'site_members_user_id_idx');
        });

        Schema::table('branches', function (Blueprint $table) {
            // Index for site's branches
            $table->index(['site_id', 'is_default'], 'branches_site_default_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pages', function (Blueprint $table) {
            $table->dropIndex('pages_branch_id_idx');
            $table->dropIndex('pages_logical_id_idx');
            $table->dropIndex('pages_parent_id_idx');
            $table->dropIndex('pages_branch_parent_order_idx');
            $table->dropFullText('pages_title_fulltext_idx');
        });

        Schema::table('pull_requests', function (Blueprint $table) {
            $table->dropIndex('pull_requests_site_status_idx');
            $table->dropIndex('pull_requests_source_branch_idx');
            $table->dropIndex('pull_requests_target_branch_idx');
            $table->dropIndex('pull_requests_author_idx');
        });

        Schema::table('commits', function (Blueprint $table) {
            $table->dropIndex('commits_branch_created_idx');
            $table->dropIndex('commits_site_created_idx');
        });

        Schema::table('commit_pages', function (Blueprint $table) {
            $table->dropIndex('commit_pages_commit_id_idx');
            $table->dropIndex('commit_pages_page_id_idx');
        });

        Schema::table('pull_request_reviews', function (Blueprint $table) {
            $table->dropIndex('pr_reviews_pr_id_idx');
            $table->dropIndex('pr_reviews_user_id_idx');
            $table->dropIndex('pr_reviews_pr_user_idx');
        });

        Schema::table('site_members', function (Blueprint $table) {
            $table->dropIndex('site_members_site_role_idx');
            $table->dropIndex('site_members_user_id_idx');
        });

        Schema::table('branches', function (Blueprint $table) {
            $table->dropIndex('branches_site_default_idx');
        });
    }
};
