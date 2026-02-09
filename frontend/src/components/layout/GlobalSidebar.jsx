import { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  ChevronDown,
  Plus,
  LogOut,
  Moon,
  Sun,
  X,
  Globe,
  Layers,
  Sparkles
} from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import useSiteStore from '../../stores/siteStore';
import { useTheme } from '../../stores/ThemeContext';

function NavItem({ to, icon: Icon, children, isActive, onClick }) {
  const baseClasses = `
    flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] font-medium
    transition-all duration-150 cursor-pointer
  `;
  
  const activeClasses = isActive
    ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]';

  if (to) {
    return (
      <NavLink to={to} className={`${baseClasses} ${activeClasses}`}>
        <Icon size={16} className="shrink-0" />
        <span className="flex-1 truncate">{children}</span>
      </NavLink>
    );
  }

  return (
    <button onClick={onClick} className={`${baseClasses} ${activeClasses} w-full`}>
      <Icon size={16} className="shrink-0" />
      <span className="flex-1 truncate text-left">{children}</span>
    </button>
  );
}

function SiteItem({ site, isActive }) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/sites/${site.id}`)}
      className={`
        w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[13px]
        transition-colors cursor-pointer group
        ${isActive 
          ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]' 
          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]'
        }
      `}
    >
      <div className="w-5 h-5 rounded-md bg-gradient-to-br from-[var(--color-accent)] to-teal-500 flex items-center justify-center shrink-0">
        <Sparkles size={10} className="text-white" />
      </div>
      <span className="truncate flex-1 text-left font-medium">{site.name}</span>
      {site.is_published && (
        <Globe size={11} className="text-[var(--color-accent)] shrink-0" />
      )}
    </button>
  );
}

function GlobalSidebar({ isOpen, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { sites, fetchSites } = useSiteStore();
  const { theme, toggleTheme } = useTheme();
  
  const isDark = theme === 'dark';

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  // Extract active site ID from URL
  const activeSiteId = location.pathname.startsWith('/sites/') 
    ? location.pathname.split('/')[2] 
    : null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-screen
        w-[200px] bg-[var(--color-bg-tertiary)] border-r border-[var(--color-border-primary)]
        flex flex-col
        transition-transform duration-200 ease-out
        lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header - User Section */}
        <div className="p-2 border-b border-[var(--color-border-primary)]">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[var(--color-bg-hover)] cursor-pointer transition-colors">
            {user?.avatar_url ? (
              <img 
                src={user.avatar_url} 
                alt={user.name}
                className="w-7 h-7 rounded-full ring-2 ring-[var(--color-border-secondary)]"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--color-accent)] to-teal-500 flex items-center justify-center text-white text-xs font-medium">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[var(--color-text-primary)] truncate">{user?.name}</p>
              <p className="text-[10px] text-[var(--color-text-muted)] truncate">{user?.email}</p>
            </div>
            <ChevronDown size={14} className="text-[var(--color-text-muted)]" />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          <NavItem 
            to="/" 
            icon={Home} 
            isActive={location.pathname === '/'}
          >
            Home
          </NavItem>

          {/* Sites Section */}
          <div className="pt-3">
            <div className="flex items-center justify-between px-2.5 py-1 mb-1">
              <span className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                Docs Sites
              </span>
              <button
                onClick={() => navigate('/')}
                className="p-0.5 hover:bg-[var(--color-bg-hover)] rounded transition-colors text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                title="Create new site"
              >
                <Plus size={12} />
              </button>
            </div>

            <div className="space-y-0.5">
              {sites.length === 0 ? (
                <div className="px-2.5 py-4 text-center">
                  <Layers size={24} className="mx-auto text-[var(--color-text-muted)] opacity-50 mb-2" />
                  <p className="text-[10px] text-[var(--color-text-muted)]">No sites yet</p>
                  <button
                    onClick={() => navigate('/')}
                    className="mt-1 text-[10px] text-[var(--color-accent)] hover:underline"
                  >
                    Create your first site
                  </button>
                </div>
              ) : (
                sites.map((site) => (
                  <SiteItem 
                    key={site.id} 
                    site={site} 
                    isActive={site.id === activeSiteId}
                  />
                ))
              )}
            </div>
          </div>
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-[var(--color-border-primary)] space-y-0.5">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-lg text-[13px] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
            <span>{isDark ? 'Light mode' : 'Dark mode'}</span>
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-lg text-[13px] text-[var(--color-text-secondary)] hover:bg-[var(--color-danger)]/10 hover:text-[var(--color-danger)] transition-colors"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>

        {/* Mobile Close Button */}
        <button
          onClick={onClose}
          className="lg:hidden absolute top-2 right-2 p-1.5 rounded-lg hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] transition-colors"
        >
          <X size={18} />
        </button>
      </aside>
    </>
  );
}

export default GlobalSidebar;
