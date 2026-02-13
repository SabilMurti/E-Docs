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
        'name',
        'created_by',
        'is_default'
    ];

    public function site()
    {
        return $this->belongsTo(Site::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function pages()
    {
        return $this->hasMany(Page::class);
    }
}
