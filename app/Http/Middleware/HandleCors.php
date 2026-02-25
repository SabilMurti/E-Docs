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
        $isAllowed = $origin && in_array($origin, $this->allowedOrigins);

        // Handle preflight OPTIONS request — must always respond with 200
        // even before auth middleware runs
        if ($request->isMethod('OPTIONS')) {
            $responseOrigin = $isAllowed ? $origin : ($this->allowedOrigins[0]);

            return response('', 200)
                ->header('Access-Control-Allow-Origin', $responseOrigin)
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With, X-XSRF-TOKEN')
                ->header('Access-Control-Allow-Credentials', 'true')
                ->header('Access-Control-Max-Age', '86400');
        }

        $response = $next($request);

        // Add CORS headers only for allowed origins
        if ($isAllowed) {
            $response->headers->set('Access-Control-Allow-Origin', $origin);
            $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
            $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With, X-XSRF-TOKEN');
            $response->headers->set('Access-Control-Allow-Credentials', 'true');
        } elseif (app()->environment('production') && $origin) {
            abort(403, 'CORS origin not allowed');
        }

        return $response;
    }
}
