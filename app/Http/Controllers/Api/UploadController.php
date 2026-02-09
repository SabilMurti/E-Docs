<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class UploadController extends Controller
{
    /**
     * Handle file uploads
     */
    public function store(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:10240', // 10MB default max
        ]);

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            
            // Check type
            $mimeType = $file->getMimeType();
            $isImage = str_starts_with($mimeType, 'image/');
            
            // Folder structure: uploads/images or uploads/files
            // Use 'public' disk
            $directory = $isImage ? 'uploads/images' : 'uploads/files';
            
            // Store file
            $path = $file->store($directory, 'public');
            
            // Generate full URL
            $url = Storage::url($path);
            
            return response()->json([
                'url' => asset($url),
                'filename' => $file->getClientOriginalName(),
                'size' => $file->getSize(),
                'type' => $mimeType,
                'is_image' => $isImage,
            ]);
        }

        return response()->json(['message' => 'No file uploaded'], 400);
    }
}
