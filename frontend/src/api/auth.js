import client from './client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

/**
 * Get current authenticated user
 */
export const getMe = async () => {
  const response = await client.get('/auth/me');
  return response.data;
};

/**
 * Logout user and revoke token
 */
export const logout = async () => {
  const response = await client.post('/auth/logout');
  localStorage.removeItem('token');
  return response.data;
};

/**
 * Get OAuth redirect URL from backend
 * @param {'google' | 'github'} provider
 * @returns {Promise<string>} OAuth URL to redirect to
 */
export const getOAuthUrl = async (provider) => {
  const response = await client.get(`/auth/${provider}`);
  return response.data.url;
};

/**
 * Initiate OAuth login via full page redirect
 * This avoids popup/COOP issues entirely
 * 
 * @param {'google' | 'github'} provider
 */
export const loginWithOAuth = async (provider) => {
  try {
    const url = await getOAuthUrl(provider);
    if (url) {
      // Store that we're in OAuth flow
      sessionStorage.setItem('oauth_in_progress', 'true');
      // Full page redirect to OAuth provider
      window.location.href = url;
    } else {
      throw new Error('Failed to get OAuth URL');
    }
  } catch (error) {
    console.error('OAuth error:', error);
    throw error;
  }
};

export default {
  getMe,
  logout,
  getOAuthUrl,
  loginWithOAuth,
};
