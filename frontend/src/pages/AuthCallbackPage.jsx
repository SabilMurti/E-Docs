import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import LoadingSpinner from '../components/common/LoadingSpinner';

/**
 * OAuth callback page - handles redirect from backend after OAuth
 * URL: /auth/callback?token=xxx&user={}
 */
function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuth, fetchUser } = useAuthStore();
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const userJson = searchParams.get('user');
      const errorMsg = searchParams.get('error');

      if (errorMsg) {
        setError(errorMsg);
        setTimeout(() => navigate('/login?error=' + encodeURIComponent(errorMsg)), 2000);
        return;
      }

      if (token) {
        // Save token to localStorage
        localStorage.setItem('token', token);
        
        // Parse user if provided
        let user = null;
        if (userJson) {
          try {
            user = JSON.parse(userJson);
          } catch (e) {
            console.log('Could not parse user JSON');
          }
        }
        
        // Update store with auth data
        if (user) {
          setAuth(user, token);
        } else {
          // Fetch fresh user data
          await fetchUser();
        }
        
        // Redirect to home
        navigate('/', { replace: true });
      } else {
        setError('No token received');
        setTimeout(() => navigate('/login'), 2000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, setAuth, fetchUser]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-secondary)]">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-2">
            Login failed
          </div>
          <p className="text-[var(--color-text-secondary)]">
            {error}
          </p>
          <p className="text-sm text-[var(--color-text-muted)] mt-4">
            Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-secondary)]">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="text-[var(--color-text-secondary)] mt-4">
          Completing authentication...
        </p>
      </div>
    </div>
  );
}

export default AuthCallbackPage;
