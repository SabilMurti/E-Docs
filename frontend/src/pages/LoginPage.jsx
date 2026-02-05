import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { loginWithOAuth } from '../api/auth';
import OAuthButton from '../components/auth/OAuthButton';

function LoginPage() {
  const [loadingProvider, setLoadingProvider] = useState(null);
  const [error, setError] = useState(null);
  const [searchParams] = useSearchParams();

  // Check for error in URL (from failed OAuth)
  useEffect(() => {
    const errorMsg = searchParams.get('error');
    if (errorMsg) {
      setError(errorMsg);
    }
  }, [searchParams]);

  const handleLogin = async (provider) => {
    setLoadingProvider(provider);
    setError(null);
    try {
      // This will redirect the page, so no callback needed
      await loginWithOAuth(provider);
    } catch (err) {
      setError(err.message);
      setLoadingProvider(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-secondary)]">
      <div className="w-full max-w-md mx-4">
        {/* Card */}
        <div className="
          bg-[var(--color-bg-primary)]
          rounded-2xl shadow-xl
          p-8 border border-[var(--color-border)]
        ">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="
              w-16 h-16 mx-auto mb-4
              bg-gradient-to-br from-[var(--color-accent)] to-blue-600
              rounded-2xl flex items-center justify-center
              shadow-lg shadow-[var(--color-accent)]/25
            ">
              <span className="text-white font-bold text-2xl">E</span>
            </div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
              Welcome to E-Docs
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-2">
              Sign in to continue to your documentation
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm text-center">
              {error}
            </div>
          )}

          {/* OAuth Buttons */}
          <div className="space-y-3">
            <OAuthButton 
              provider="google"
              onLogin={handleLogin}
              isLoading={loadingProvider === 'google'}
            />
            <OAuthButton 
              provider="github"
              onLogin={handleLogin}
              isLoading={loadingProvider === 'github'}
            />
          </div>

          {/* Terms */}
          <p className="text-xs text-center text-[var(--color-text-muted)] mt-6">
            By continuing, you agree to our{' '}
            <a href="#" className="text-[var(--color-accent)] hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-[var(--color-accent)] hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-[var(--color-text-muted)] mt-6">
          Don't have an account? Just sign in with OAuth to get started.
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
