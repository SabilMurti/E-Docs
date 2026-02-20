import { useState } from 'react';
import { Outlet, useParams, useLocation } from 'react-router-dom';
import UnifiedSidebar from './UnifiedSidebar';
import { Menu, Bell } from 'lucide-react';
import NotificationBell from '../common/NotificationBell';

/**
 * MainLayout Component
 * 
 * Provides the main application layout with sidebar and header.
 * Features responsive design with mobile sidebar support.
 */
function MainLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      {/* Unified Sidebar */}
      <UnifiedSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="lg:ml-[260px] min-h-screen flex flex-col">
        {/* Global Header */}
        <header 
          className="h-14 border-b border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] sticky top-0 z-30 flex items-center justify-between px-4"
          role="banner"
        >
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] transition-colors"
              aria-label="Open navigation menu"
              aria-expanded={sidebarOpen}
            >
              <Menu size={20} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1" role="main">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
