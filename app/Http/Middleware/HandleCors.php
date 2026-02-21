<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class HandleCors
{
    /**
     * Allowed origins for CORS
     */
    protected array $allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:8001',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
        'http://127.0.0.1:8001',
    ];

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $origin = $request->header('Origin');

        // Only allow requests from whitelisted origins
        // Never use wildcard (*) with credentials - it's a security vulnerability
        if (!in_array($origin, $this->allowedOrigins)) {
            // In production, you might want to abort(403) instead
            // For development, we'll just continue but not set CORS headers
            if (app()->environment('production')) {
                abort(403, 'CORS origin not allowed');
            }
        }

        // Handle preflight OPTIONS request
        if ($request->isMethod('OPTIONS')) {
            return response('', 200)
                ->header('Access-Control-Allow-Origin', $origin)
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With, X-XSRF-TOKEN')
                ->header('Access-Control-Allow-Credentials', 'true')
                ->header('Access-Control-Max-Age', '86400');
        }

        $response = $next($request);

        // Add CORS headers only if origin is allowed
        if (in_array($origin, $this->allowedOrigins)) {
            $response->headers->set('Access-Control-Allow-Origin', $origin);
            $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
            $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With, X-XSRF-TOKEN');
            $response->headers->set('Access-Control-Allow-Credentials', 'true');
        }

        return $response;
    }
}
