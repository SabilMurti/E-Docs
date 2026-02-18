/**
 * Auth Debugging Utilities
 * Use this to diagnose authentication issues
 */

export const debugAuth = () => {
  const token = localStorage.getItem('token');
  const authStorage = localStorage.getItem('auth-storage');
  
  console.group('🔍 Auth Debug Info');
  console.log('1. Token in localStorage:', token ? '✅ EXISTS' : '❌ MISSING');
  console.log('   Token value:', token);
  console.log('');
  console.log('2. Auth Storage (Zustand):', authStorage ? '✅ EXISTS' : '❌ MISSING');
  try {
    const parsed = JSON.parse(authStorage || '{}');
    console.log('   Parsed:', parsed);
    console.log('   Is Authenticated:', parsed.state?.isAuthenticated);
    console.log('   User:', parsed.state?.user);
  } catch (e) {
    console.error('   Failed to parse:', e);
  }
  console.log('');
  console.log('3. Session Storage:');
  console.log('   oauth_in_progress:', sessionStorage.getItem('oauth_in_progress'));
  console.groupEnd();
  
  return {
    hasToken: !!token,
    token,
    authStorage: JSON.parse(authStorage || '{}'),
  };
};

export const testApiCall = async () => {
  const token = localStorage.getItem('token');
  
  console.group('🧪 Test API Call');
  console.log('Making test request to /auth/me...');
  
  try {
    const response = await fetch('http://localhost:8000/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });
    
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', data);
    
    if (response.ok) {
      console.log('✅ Authentication is working!');
    } else {
      console.error('❌ Authentication failed!');
      console.error('Possible issues:');
      console.error('- Token is invalid or expired');
      console.error('- Backend is not running');
      console.error('- CORS configuration issue');
    }
  } catch (error) {
    console.error('❌ Request failed:', error);
    console.error('Possible issues:');
    console.error('- Backend is not running');
    console.error('- Network error');
  }
  
  console.groupEnd();
};

// Auto-run on import in development
if (import.meta.env.DEV) {
  console.log('🔧 Auth Debug Utils loaded. Use debugAuth() and testApiCall() in console.');
}
