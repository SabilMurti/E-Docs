import { useState } from 'react';
import { Outlet, useParams, useLocation } from 'react-router-dom';
import UnifiedSidebar from './UnifiedSidebar';
import { Menu } from 'lucide-react';

function MainLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      {/* Unified Sidebar */}
      <UnifiedSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Main Content Area - Offset by sidebar width */}
      <div className="lg:ml-[260px] min-h-screen flex flex-col">
        {/* Mobile Header */}
        <header className="lg:hidden h-14 border-b border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] sticky top-0 z-30 flex items-center px-4">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 rounded-lg hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] transition-colors"
          >
            <Menu size={20} />
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
