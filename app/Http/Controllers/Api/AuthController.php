<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Laravel\Socialite\Facades\Socialite;

class AuthController extends Controller
{
    /**
     * Redirect to Google OAuth
     */
    public function redirectToGoogle(): JsonResponse
    {
        $url = Socialite::driver('google')
            ->stateless()
            ->redirect()
            ->getTargetUrl();

        return response()->json(['url' => $url]);
    }

    /**
     * Handle Google OAuth callback
     */
    public function handleGoogleCallback()
    {
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
        
        try {
            $googleUser = Socialite::driver('google')->stateless()->user();

            // Find user by Google ID or Email
            $user = User::where('google_id', $googleUser->getId())->first();

            if (!$user) {
                $user = User::where('email', $googleUser->getEmail())->first();
                
                if ($user) {
                    // Link existing account
                    $user->update([
                        'google_id' => $googleUser->getId(),
                        'avatar_url' => $user->avatar_url ?? $googleUser->getAvatar(),
                    ]);
                } else {
                    // Create new user
                    $user = User::create([
                        'name' => $googleUser->getName(),
                        'email' => $googleUser->getEmail(),
                        'google_id' => $googleUser->getId(),
                        'avatar_url' => $googleUser->getAvatar(),
                    ]);
                }
            } else {
                // Update avatar if changed (and not null from provider)
                if ($googleUser->getAvatar()) {
                    $user->update([
                        'avatar_url' => $googleUser->getAvatar(),
                    ]);
                }
            }

            // Create token
            $token = $user->createToken('auth-token')->plainTextToken;

            // Redirect to frontend with token
            $params = http_build_query([
                'token' => $token,
                'user' => json_encode([
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'avatar_url' => $user->avatar_url,
                ]),
            ]);

            return redirect($frontendUrl . '/auth/callback?' . $params);
        } catch (\Exception $e) {
            return redirect($frontendUrl . '/login?error=' . urlencode($e->getMessage()));
        }
    }

    /**
     * Redirect to GitHub OAuth
     */
    public function redirectToGithub(): JsonResponse
    {
        $url = Socialite::driver('github')
            ->stateless()
            ->redirect()
            ->getTargetUrl();

        return response()->json(['url' => $url]);
    }

    /**
     * Handle GitHub OAuth callback
     */
    public function handleGithubCallback()
    {
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
        
        try {
            $githubUser = Socialite::driver('github')->stateless()->user();

            // Check if user exists with this GitHub ID
            $user = User::where('github_id', $githubUser->getId())->first();

            if (! $user) {
                // Check if email exists (link accounts)
                $user = User::where('email', $githubUser->getEmail())->first();

                if ($user) {
                    // Link GitHub to existing account
                    $user->update([
                        'github_id' => $githubUser->getId(),
                        'avatar_url' => $user->avatar_url ?? $githubUser->getAvatar(),
                    ]);
                } else {
                    // Create new user
                    $user = User::create([
                        'name' => $githubUser->getName() ?? $githubUser->getNickname(),
                        'email' => $githubUser->getEmail(),
                        'github_id' => $githubUser->getId(),
                        'avatar_url' => $githubUser->getAvatar(),
                    ]);
                }
            } else {
                // Update avatar if changed
                $user->update([
                    'avatar_url' => $githubUser->getAvatar(),
                ]);
            }

            // Create token
            $token = $user->createToken('auth-token')->plainTextToken;

            // Redirect to frontend with token
            $params = http_build_query([
                'token' => $token,
                'user' => json_encode([
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'avatar_url' => $user->avatar_url,
                ]),
            ]);

            return redirect($frontendUrl . '/auth/callback?' . $params);
        } catch (\Exception $e) {
            return redirect($frontendUrl . '/login?error=' . urlencode($e->getMessage()));
        }
    }

    /**
     * Return HTML page that sends data via postMessage to opener window
     * With fallback to redirect if postMessage is blocked by COOP
     */
    private function postMessageResponse(array $data)
    {
        $json = json_encode($data);
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');

        $html = <<<HTML
<!DOCTYPE html>
<html>
<head>
    <title>Authentication</title>
    <style>
        body {
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: #f8fafc;
            color: #334155;
        }
        .loader {
            text-align: center;
        }
        .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid #e2e8f0;
            border-top-color: #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 16px;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="loader">
        <div class="spinner"></div>
        <p>Completing authentication...</p>
    </div>
    <script>
        (function() {
            const data = {$json};
            const frontendUrl = '{$frontendUrl}';
            const targetOrigin = frontendUrl;
            
            // Strategy 1: Try postMessage to opener (may be blocked by COOP)
            let messageSent = false;
            try {
                if (window.opener && !window.opener.closed) {
                    window.opener.postMessage(data, frontendUrl);
                    messageSent = true;
                    // Try to close, but may fail due to COOP
                    setTimeout(() => {
                        try { window.close(); } catch(e) {}
                    }, 100);
                }
            } catch (e) {
                console.log('postMessage failed:', e);
            }
            
            // Strategy 2: Always redirect after short delay
            // This ensures login works even if postMessage fails
            setTimeout(() => {
                if (data.type === 'oauth-success') {
                    // Redirect to frontend with token
                    const params = new URLSearchParams({
                        token: data.token,
                        user: JSON.stringify(data.user)
                    });
                    window.location.href = frontendUrl + '/auth/callback?' + params.toString();
                } else {
                    window.location.href = frontendUrl + '/login?error=' + encodeURIComponent(data.error || 'Login failed');
                }
            }, messageSent ? 500 : 0);
        })();
    </script>
</body>
</html>
HTML;

        return response($html)->header('Content-Type', 'text/html')->header('Content-Security-Policy', "default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'");
    }

    /**
     * Get current authenticated user
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json($request->user());
    }

    /**
     * Logout (revoke current token)
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }
}
