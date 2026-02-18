import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import client from '../api/client';
import Button from '../components/common/Button';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

/**
 * Debug Authentication Page
 * Helps diagnose authentication issues
 */
export default function DebugAuthPage() {
  const navigate = useNavigate();
  const { user, token: storeToken, isAuthenticated } = useAuthStore();
  
  const [checks, setChecks] = useState({
    localStorage: null,
    storeSync: null,
    apiTest: null,
  });
  
  const [apiResponse, setApiResponse] = useState(null);
  const [testing, setTesting] = useState(false);
  
  useEffect(() => {
    runDiagnostics();
  }, []);
  
  const runDiagnostics = async () => {
    const results = {};
    
    // Check 1: localStorage token
    const localToken = localStorage.getItem('token');
    results.localStorage = {
      status: localToken ? 'pass' : 'fail',
      message: localToken ? '✅ Token found in localStorage' : '❌ No token in localStorage',
      value: localToken ? localToken.substring(0, 20) + '...' : null,
    };
    
    // Check 2: Zustand store sync
    const authStorage = localStorage.getItem('auth-storage');
    let storeData = null;
    try {
      storeData = JSON.parse(authStorage || '{}');
    } catch (e) {}
    
    results.storeSync = {
      status: storeData?.state?.isAuthenticated ? 'pass' : 'fail',
      message: storeData?.state?.isAuthenticated 
        ? '✅ Zustand store is authenticated' 
        : '❌ Zustand store is NOT authenticated',
      value: storeData?.state?.user,
    };
    
    // Check 3: Test API call
    if (localToken) {
      try {
        const response = await client.get('/auth/me');
        results.apiTest = {
          status: 'pass',
          message: '✅ API authentication working',
          value: response.data,
        };
        setApiResponse(response.data);
      } catch (error) {
        results.apiTest = {
          status: 'fail',
          message: '❌ API authentication failed: ' + (error.response?.data?.message || error.message),
          value: error.response?.data,
        };
        setApiResponse(error.response?.data);
      }
    } else {
      results.apiTest = {
        status: 'skip',
        message: '⏭️ Skipped (no token)',
        value: null,
      };
    }
    
    setChecks(results);
  };
  
  const handleRerun = () => {
    setTesting(true);
    runDiagnostics().finally(() => setTesting(false));
  };
  
  const handleClearAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('auth-storage');
    window.location.href = '/login';
  };
  
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pass': return <CheckCircle className="text-green-600" size={20} />;
      case 'fail': return <XCircle className="text-red-600" size={20} />;
      case 'skip': return <AlertCircle className="text-gray-400" size={20} />;
      default: return <RefreshCw className="text-gray-400 animate-spin" size={20} />;
    }
  };
  
  return (
    <div className="min-h-screen bg-[var(--color-bg-secondary)] p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-[var(--color-bg-primary)] rounded-xl border border-[var(--color-border-primary)] p-6 mb-6">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
            🔍 Authentication Debugger
          </h1>
          <p className="text-[var(--color-text-secondary)]">
            This page helps diagnose authentication issues when creating pages or making API calls.
          </p>
        </div>
        
        {/* Current Auth Status */}
        <div className="bg-[var(--color-bg-primary)] rounded-xl border border-[var(--color-border-primary)] p-6 mb-6">
          <h2 className="font-semibold text-lg mb-4">Current Auth Status</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-[var(--color-text-muted)]">Authenticated:</span>
              <span className={`ml-2 font-medium ${isAuthenticated ? 'text-green-600' : 'text-red-600'}`}>
                {isAuthenticated ? 'Yes ✅' : 'No ❌'}
              </span>
            </div>
            <div>
              <span className="text-[var(--color-text-muted)]">User:</span>
              <span className="ml-2 font-medium">{user?.name || 'None'}</span>
            </div>
          </div>
        </div>
        
        {/* Diagnostic Checks */}
        <div className="bg-[var(--color-bg-primary)] rounded-xl border border-[var(--color-border-primary)] p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Diagnostic Checks</h2>
            <Button size="sm" onClick={handleRerun} disabled={testing}>
              <RefreshCw size={14} className={testing ? 'animate-spin' : ''} />
              Re-run
            </Button>
          </div>
          
          <div className="space-y-4">
            {Object.entries(checks).map(([key, check]) => (
              <div key={key} className="border border-[var(--color-border-secondary)] rounded-lg p-4">
                <div className="flex items-start gap-3">
                  {getStatusIcon(check?.status)}
                  <div className="flex-1">
                    <div className="font-medium text-[var(--color-text-primary)] mb-1">
                      {key === 'localStorage' && 'localStorage Token'}
                      {key === 'storeSync' && 'Zustand Store Sync'}
                      {key === 'apiTest' && 'API Authentication Test'}
                    </div>
                    <div className="text-sm text-[var(--color-text-secondary)]">
                      {check?.message || 'Running...'}
                    </div>
                    {check?.value && (
                      <pre className="mt-2 p-2 bg-[var(--color-bg-tertiary)] rounded text-xs overflow-x-auto">
                        {typeof check.value === 'string' 
                          ? check.value 
                          : JSON.stringify(check.value, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Common Issues */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-3">
            🚨 Common Issues & Solutions
          </h3>
          <ul className="space-y-2 text-sm text-yellow-800 dark:text-yellow-300">
            <li>
              <strong>No token in localStorage:</strong> You need to login again via OAuth
            </li>
            <li>
              <strong>Token exists but API fails:</strong> Token might be expired or invalid. Clear auth and login again.
            </li>
            <li>
              <strong>Store not synced:</strong> There might be a mismatch between localStorage and Zustand. Try refreshing.
            </li>
          </ul>
        </div>
        
        {/* Actions */}
        <div className="flex gap-3">
          <Button onClick={() => navigate('/login')}>
            Go to Login
          </Button>
          <Button onClick={handleClearAuth} className="bg-red-600 hover:bg-red-700">
            Clear Auth & Re-login
          </Button>
          <Button onClick={() => navigate('/')} className="bg-transparent text-[var(--color-text-primary)]">
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
