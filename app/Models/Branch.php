<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Branch extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'site_id',
        'parent_branch_id',
        'name',
        'is_default'
    ];

    public function parent()
    {
        return $this->belongsTo(Branch::class, 'parent_branch_id');
    }

    public function children()
    {
        return $this->hasMany(Branch::class, 'parent_branch_id');
    }

    public function site()
    {
        return $this->belongsTo(Site::class);
    }

    public function pages()
    {
        return $this->hasMany(Page::class);
    }
}
