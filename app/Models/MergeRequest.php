<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class MergeRequest extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'site_id',
        'source_branch_id',
        'target_branch_id',
        'title',
        'description',
        'status',
        'author_id',
        'reviewer_id',
        'merged_by',
        'merged_at'
    ];

    public function site()
    {
        return $this->belongsTo(Site::class);
    }

    public function sourceBranch()
    {
        return $this->belongsTo(Branch::class, 'source_branch_id');
    }

    public function targetBranch()
    {
        return $this->belongsTo(Branch::class, 'target_branch_id');
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }
}
