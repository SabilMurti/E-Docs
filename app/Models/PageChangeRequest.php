<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PageChangeRequest extends Model
{
    use HasFactory, HasUuids;

    protected $guarded = ['id'];
    
    protected $casts = [
        'content' => 'array',
        'base_content' => 'array',
    ];

    public function page(): BelongsTo
    {
        return $this->belongsTo(Page::class);
    }
    
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function commits()
    {
        return $this->hasMany(PageCommit::class, 'page_change_request_id');
    }
}
