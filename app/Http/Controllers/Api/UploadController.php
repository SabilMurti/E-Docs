<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class UploadController extends Controller
{
    /**
     * Allowed MIME types for images
     */
    protected array $allowedImageTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
    ];

    /**
     * Allowed MIME types for files
     */
    protected array $allowedFileTypes = [
        'application/pdf',
        'application/zip',
        'application/x-zip-compressed',
        'text/plain',
        'text/csv',
        'application/json',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    /**
     * Maximum file size in bytes (10MB)
     */
    protected int $maxFileSize = 10 * 1024 * 1024;

    /**
     * Handle file uploads
     */
    public function store(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:10240', // 10MB
        ]);

        if ($request->hasFile('file')) {
            $file = $request->file('file');

            // Check file size
            if ($file->getSize() > $this->maxFileSize) {
                return response()->json([
                    'message' => 'File size exceeds maximum allowed size (10MB).',
                ], 422);
            }

            // Get MIME type
            $mimeType = $file->getMimeType();
            $isImage = str_starts_with($mimeType, 'image/');

            // Validate MIME type
            if ($isImage && !in_array($mimeType, $this->allowedImageTypes)) {
                return response()->json([
                    'message' => 'Image type not allowed. Allowed types: JPEG, PNG, GIF, WebP, SVG.',
                ], 422);
            }

            if (!$isImage && !in_array($mimeType, $this->allowedFileTypes)) {
                return response()->json([
                    'message' => 'File type not allowed.',
                ], 422);
            }

            // Generate secure filename
            $extension = $file->getClientOriginalExtension();
            $filename = Str::random(40) . '.' . $extension;

            // Folder structure: uploads/images or uploads/files
            $directory = $isImage ? 'uploads/images' : 'uploads/files';

            try {
                // Store file with secure name
                $path = $file->storeAs($directory, $filename, 'public');

                // Generate relative path (e.g. /storage/uploads/images/xxx.png)
                // Using relative path so frontend resolves against the correct backend origin
                $relativePath = Storage::disk('public')->url($path);

                return response()->json([
                    'url' => $relativePath,
                    'filename' => $file->getClientOriginalName(),
                    'size' => $file->getSize(),
                    'type' => $mimeType,
                    'is_image' => $isImage,
                ]);
            } catch (\Exception $e) {
                Log::error('File upload failed: ' . $e->getMessage());

                return response()->json([
                    'message' => 'Failed to upload file. Please try again.',
                ], 500);
            }
        }

        return response()->json(['message' => 'No file uploaded'], 400);
    }
}
