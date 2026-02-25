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
        return $this->getOAuthRedirectUrl('google');
    }

    /**
     * Handle Google OAuth callback
     */
    public function handleGoogleCallback()
    {
        return $this->handleOAuthCallback('google');
    }

    /**
     * Redirect to GitHub OAuth
     * Requests user:email scope so GitHub always provides the user's email,
     * even if they have set it to private in their GitHub profile settings.
     */
    public function redirectToGithub(): JsonResponse
    {
        $url = Socialite::driver('github')
            ->stateless()
            ->scopes(['user:email'])
            ->redirect()
            ->getTargetUrl();

        return response()->json(['url' => $url]);
    }

    /**
     * Handle GitHub OAuth callback
     */
    public function handleGithubCallback()
    {
        return $this->handleOAuthCallback('github');
    }

    /**
     * Get OAuth redirect URL
     */
    private function getOAuthRedirectUrl(string $driver): JsonResponse
    {
        $url = Socialite::driver($driver)
            ->stateless()
            ->redirect()
            ->getTargetUrl();

        return response()->json(['url' => $url]);
    }

    /**
     * Handle OAuth callback for any provider
     */
    private function handleOAuthCallback(string $driver)
    {
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
        $providerIdField = $driver . '_id';

        try {
            $providerUser = Socialite::driver($driver)->stateless()->user();

            // Find or create user
            $user = $this->findOrCreateUser(
                $providerUser,
                $providerIdField,
                $driver
            );

            // Create token
            $token = $user->createToken('auth-token')->plainTextToken;

            // Redirect to frontend with token
            return $this->redirectToFrontendWithToken(
                $frontendUrl,
                $token,
                $user
            );
        } catch (\Exception $e) {
            return redirect($frontendUrl . '/login?error=' . urlencode($e->getMessage()));
        }
    }

    /**
     * Find existing user or create new one
     */
    private function findOrCreateUser($providerUser, string $providerIdField, string $driver): User
    {
        // Find by provider ID
        $user = User::where($providerIdField, $providerUser->getId())->first();

        if ($user) {
            // Update avatar if changed
            if ($providerUser->getAvatar()) {
                $user->update([
                    $providerIdField => $providerUser->getId(),
                    'avatar_url' => $providerUser->getAvatar(),
                ]);
            }
            return $user;
        }

        // Find by email (link accounts)
        $user = User::where('email', $providerUser->getEmail())->first();

        if ($user) {
            // Link provider to existing account
            $user->update([
                $providerIdField => $providerUser->getId(),
                'avatar_url' => $user->avatar_url ?? $providerUser->getAvatar(),
            ]);
            return $user;
        }

        // Create new user
        // For GitHub with private email: use synthetic placeholder so the unique
        // email constraint is not violated. With user:email scope this should rarely happen.
        $email = $providerUser->getEmail()
            ?? ($driver === 'github' ? 'github_' . $providerUser->getId() . '@noemail.edocs' : null);

        return User::create([
            'name' => $this->getUserName($providerUser, $driver),
            'email' => $email,
            $providerIdField => $providerUser->getId(),
            'avatar_url' => $providerUser->getAvatar(),
        ]);
    }

    /**
     * Get user name from provider
     */
    private function getUserName($providerUser, string $driver): string
    {
        if ($driver === 'github') {
            return $providerUser->getName() ?? $providerUser->getNickname();
        }

        return $providerUser->getName();
    }

    /**
     * Redirect to frontend with authentication data
     */
    private function redirectToFrontendWithToken(string $frontendUrl, string $token, User $user)
    {
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
