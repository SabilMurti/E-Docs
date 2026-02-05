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
        try {
            $googleUser = Socialite::driver('google')->stateless()->user();

            $user = User::updateOrCreate(
                ['google_id' => $googleUser->getId()],
                [
                    'name' => $googleUser->getName(),
                    'email' => $googleUser->getEmail(),
                    'avatar_url' => $googleUser->getAvatar(),
                ]
            );

            // Create token
            $token = $user->createToken('auth-token')->plainTextToken;

            return $this->postMessageResponse([
                'type' => 'oauth-success',
                'token' => $token,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'avatar_url' => $user->avatar_url,
                ],
            ]);
        } catch (\Exception $e) {
            return $this->postMessageResponse([
                'type' => 'oauth-error',
                'error' => $e->getMessage(),
            ]);
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

            return $this->postMessageResponse([
                'type' => 'oauth-success',
                'token' => $token,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'avatar_url' => $user->avatar_url,
                ],
            ]);
        } catch (\Exception $e) {
            return $this->postMessageResponse([
                'type' => 'oauth-error',
                'error' => $e->getMessage(),
            ]);
        }
    }

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
            
            // Send to opener window (popup mode)
            if (window.opener) {
                window.opener.postMessage(data, targetOrigin);
                window.close();
            } 
            // Fallback: send to parent (iframe mode)
            else if (window.parent !== window) {
                window.parent.postMessage(data, targetOrigin);
            }
            // No opener - redirect to frontend with token in hash
            else {
                if (data.type === 'oauth-success') {
                    window.location.href = frontendUrl + '/login/callback#token=' + data.token;
                } else {
                    window.location.href = frontendUrl + '/login#error=' + encodeURIComponent(data.error);
                }
            }
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
