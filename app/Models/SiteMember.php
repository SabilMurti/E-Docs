<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class SiteMember extends Pivot
{
    use HasUuids;

    protected $table = 'site_members';

    public $incrementing = false;

    protected $keyType = 'string';
    
    protected $fillable = [
        'site_id',
        'user_id',
        'role'
    ];
}
