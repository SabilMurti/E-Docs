import { Link, useNavigate, useParams } from 'react-router-dom';
import { Search, LogOut, Settings, User, Moon, Sun, Menu } from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import useSpaceStore from '../../stores/spaceStore';
import { useTheme } from '../../stores/ThemeContext';
import Button from '../common/Button';
import Dropdown from '../common/Dropdown';
import SearchBar from '../common/SearchBar';

function Navbar({ onMenuClick }) {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { currentSpace } = useSpaceStore();
  const { siteId } = useParams();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  
  const isDark = theme === 'dark';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSearchResult = (result) => {
    // Navigate to the selected page
    if (siteId && result.id) {
      navigate(`/sites/${siteId}/pages/${result.id}`);
    }
  };

  return (
    <nav className="
      fixed top-0 left-0 right-0 z-40
      h-[var(--navbar-height)]
      bg-[var(--color-bg-primary)]
      border-b border-[var(--color-border)]
      backdrop-blur-sm
    ">
      <div className="h-full px-4 flex items-center justify-between gap-4">
        {/* Left - Logo & Menu */}
        <div className="flex items-center gap-2">
          {/* Mobile menu button */}
          {onMenuClick && (
            <button 
              onClick={onMenuClick}
              className="
                lg:hidden p-2 rounded-lg
                hover:bg-[var(--color-bg-secondary)]
                text-[var(--color-text-secondary)]
              "
            >
              <Menu size={20} />
            </button>
          )}
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="
              w-8 h-8 
              bg-gradient-to-br from-[var(--color-accent)] to-blue-600
              rounded-lg flex items-center justify-center
              shadow-sm shadow-[var(--color-accent)]/20
            ">
              <span className="text-white font-bold text-sm">E</span>
            </div>
            <span className="hidden sm:block font-semibold text-[var(--color-text-primary)]">
              E-Docs
            </span>
          </Link>
        </div>

        {/* Center - Search */}
        {isAuthenticated && spaceId && (
          <div className="hidden md:block flex-1 max-w-md">
            <SearchBar spaceId={spaceId} onResultClick={handleSearchResult} />
          </div>
        )}

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="
              p-2 rounded-lg
              hover:bg-[var(--color-bg-secondary)]
              text-[var(--color-text-secondary)]
              transition-colors
            "
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {isAuthenticated ? (
            <Dropdown
              trigger={
                <div className="
                  flex items-center gap-2 p-1.5 
                  rounded-lg cursor-pointer
                  hover:bg-[var(--color-bg-secondary)]
                  transition-colors
                ">
                  {user?.avatar_url ? (
                    <img 
                      src={user.avatar_url} 
                      alt={user.name}
                      className="w-8 h-8 rounded-full ring-2 ring-[var(--color-border)]"
                    />
                  ) : (
                    <div className="
                      w-8 h-8 rounded-full
                      bg-gradient-to-br from-[var(--color-accent)] to-blue-600
                      flex items-center justify-center
                      text-white text-sm font-medium
                    ">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
              }
              align="right"
            >
              <div className="px-3 py-2 border-b border-[var(--color-border)]">
                <p className="font-medium text-sm text-[var(--color-text-primary)]">
                  {user?.name}
                </p>
                <p className="text-xs text-[var(--color-text-muted)] truncate max-w-[200px]">
                  {user?.email}
                </p>
              </div>
              <Dropdown.Item icon={User}>Profile</Dropdown.Item>
              {spaceId && (
                <Dropdown.Item icon={Settings} onClick={() => navigate(`/spaces/${spaceId}/settings`)}>
                  Space Settings
                </Dropdown.Item>
              )}
              <Dropdown.Divider />
              <Dropdown.Item icon={LogOut} onClick={handleLogout} danger>
                Logout
              </Dropdown.Item>
            </Dropdown>
          ) : (
            <Link to="/login">
              <Button variant="primary" size="sm">
                Login
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
