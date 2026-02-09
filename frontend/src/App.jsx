import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import useAuthStore from './stores/authStore';
import { ThemeProvider } from './stores/ThemeContext';
import MainLayout from './components/layout/MainLayout';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import SitePage from './pages/SitePage';
import SiteSettingsPage from './pages/SiteSettingsPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import PublicSitePage from './pages/PublicSitePage';
import LoadingSpinner from './components/common/LoadingSpinner';
import ChangeRequestsList from './components/pages/ChangeRequestsList';
import ChangeRequestDetail from './components/pages/ChangeRequestDetail';

// Protected Route wrapper
function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[color:var(--color-bg-primary)]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Public Route wrapper (redirect to home if authenticated)
function PublicRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[color:var(--color-bg-primary)]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  const { fetchUser } = useAuthStore();

  // Check for existing auth on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUser();
    }
  }, [fetchUser]);

  return (
    <ThemeProvider>
      <BrowserRouter>
        <Toaster richColors position="bottom-right" theme="system" />
        <Routes>
          {/* Auth callback route - handles OAuth redirect */}
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          
          {/* Public Docs Routes - No auth required */}
          <Route path="/public/:identifier" element={<PublicSitePage />} />
          <Route path="/public/:identifier/:pageSlug" element={<PublicSitePage />} />
          
          {/* Auth Routes */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            } 
          />

          {/* Protected Routes */}
          <Route 
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            {/* Dashboard */}
            <Route path="/" element={<HomePage />} />
            
            {/* Site Routes */}
            <Route path="/sites/:siteId" element={<SitePage />} />
            <Route path="/sites/:siteId/pages/:pageId" element={<SitePage />} />
            <Route path="/sites/:siteId/settings" element={<SiteSettingsPage />} />

            {/* Change Requests Routes */}
            <Route path="/sites/:siteId/pages/:pageId/requests" element={<ChangeRequestsList />} />
            <Route path="/sites/:siteId/pages/:pageId/requests/:requestId" element={<ChangeRequestDetail />} />
            
          </Route>

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
