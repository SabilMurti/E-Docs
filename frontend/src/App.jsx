import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import useAuthStore from "./stores/authStore";
import { ThemeProvider } from "./stores/ThemeContext";
import ErrorBoundary from "./components/common/ErrorBoundary";
import MainLayout from "./components/layout/MainLayout";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import SitePage from "./pages/SitePage";
import SiteSettingsPage from "./pages/SiteSettingsPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import PublicSitePage from "./pages/PublicSitePage";
import DebugAuthPage from "./pages/DebugAuthPage";
import LoadingSpinner from "./components/common/LoadingSpinner";
import ChangeRequestsList from "./components/pages/ChangeRequestsList";
import ChangeRequestDetail from "./components/pages/ChangeRequestDetail";
import MergeRequestsPage from "./components/pages/MergeRequestsPage";
import CreateMergeRequestPage from "./components/pages/CreateMergeRequestPage";
import MergeRequestDetailPage from "./components/pages/MergeRequestDetail";
import PullRequestsPage from "./components/pages/PullRequestsPage";
import CreatePullRequestPage from "./components/pages/CreatePullRequestPage";
import PullRequestDetailPage from "./components/pages/PullRequestDetailPage";
import CommitHistoryPage from "./components/pages/CommitHistoryPage";
import PageHistory from "./components/pages/PageHistory";
import BranchesPage from "./components/pages/BranchesPage";

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
        const token = localStorage.getItem("token");
        if (token) {
            fetchUser();
        }
    }, [fetchUser]);

    return (
        <ThemeProvider>
            <ErrorBoundary>
                <BrowserRouter>
                    <Toaster richColors position="bottom-right" theme="system" />
                    <Routes>
                    {/* Auth callback route - handles OAuth redirect */}
                    <Route
                        path="/auth/callback"
                        element={<AuthCallbackPage />}
                    />

                    {/* Debug Auth Route - Public */}
                    <Route path="/debug-auth" element={<DebugAuthPage />} />

                    {/* Public Docs Routes - No auth required */}
                    <Route
                        path="/public/:siteSlug"
                        element={<PublicSitePage />}
                    />
                    <Route
                        path="/public/:siteSlug/:pageSlug"
                        element={<PublicSitePage />}
                    />

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
                        <Route path="/sites/:siteSlug" element={<SitePage />} />
                        <Route
                            path="/sites/:siteSlug/pages/:pageSlug"
                            element={<SitePage />}
                        />
                        <Route
                            path="/sites/:siteSlug/settings"
                            element={<SiteSettingsPage />}
                        />

                        {/* Change Requests Routes */}
                        <Route
                            path="/sites/:siteSlug/pages/:pageSlug/requests"
                            element={<ChangeRequestsList />}
                        />
                        <Route
                            path="/sites/:siteSlug/pages/:pageSlug/requests/:requestId"
                            element={<ChangeRequestDetail />}
                        />

                        {/* Pull Requests (New GitHub-like) */}
                        <Route
                            path="/sites/:siteSlug/pulls"
                            element={<PullRequestsPage />}
                        />
                        <Route
                            path="/sites/:siteSlug/pulls/new"
                            element={<CreatePullRequestPage />}
                        />
                        <Route
                            path="/sites/:siteSlug/pulls/:prId"
                            element={<PullRequestDetailPage />}
                        />

                        {/* Commit History */}
                        <Route
                            path="/sites/:siteSlug/commits"
                            element={<CommitHistoryPage />}
                        />

                        {/* Page-Level Version History */}
                        <Route
                            path="/sites/:siteSlug/pages/:pageSlug/history"
                            element={<PageHistory />}
                        />

                        {/* Branches Management */}
                        <Route
                            path="/sites/:siteSlug/branches"
                            element={<BranchesPage />}
                        />

                        {/* Merge Requests (Legacy) */}
                        <Route
                            path="/sites/:siteSlug/merge-requests"
                            element={<MergeRequestsPage />}
                        />
                        <Route
                            path="/sites/:siteSlug/merge-requests/new"
                            element={<CreateMergeRequestPage />}
                        />
                        <Route
                            path="/sites/:siteSlug/merge-requests/:requestId"
                            element={<MergeRequestDetailPage />}
                        />
                    </Route>

                    {/* Catch all - redirect to home */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
            </ErrorBoundary>
        </ThemeProvider>
    );
}

export default App;
