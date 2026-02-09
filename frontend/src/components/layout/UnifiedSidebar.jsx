import { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Home,
  ChevronDown,
  ChevronRight,
  Plus,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  Globe,
  Layers,
  Sparkles,
  FileText,
  MoreHorizontal,
  Trash2,
  Settings,
  Book,
  Share2
} from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import useSiteStore from '../../stores/siteStore';
import usePageStore from '../../stores/pageStore';
import { useTheme } from '../../stores/ThemeContext';
import Dropdown from '../common/Dropdown';
import ConfirmModal from '../common/ConfirmModal';
import InputModal from '../common/InputModal';
import PublishModal from '../sites/PublishModal';

// Page Tree Item Component
function PageTreeItem({ page, siteId, level = 0, onDeleteRequest, onAddSubpageRequest }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { pageId } = useParams();
  const navigate = useNavigate();
  const hasChildren = page.children && page.children.length > 0;
  const isActive = pageId === page.id;
  const paddingLeft = level * 12 + 8;

  return (
    <div>
      <div 
        className={`
          group flex items-center gap-1.5 py-1 pr-1.5 rounded-md
          cursor-pointer transition-colors text-[13px] select-none
          ${isActive 
            ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]' 
            : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]'
          }
        `}
        style={{ paddingLeft: `${paddingLeft}px` }}
        onClick={() => navigate(`/sites/${siteId}/pages/${page.id}`)}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-0.5 rounded hover:bg-[var(--color-bg-hover)]"
          >
            {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
        ) : (
          <span className="w-4" />
        )}

        {page.icon && <span className="text-sm shrink-0">{page.icon}</span>}
        <span className="truncate flex-1">{page.title || 'Untitled'}</span>

        <div 
          className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center"
          onClick={(e) => e.stopPropagation()}
        >
          <Dropdown
            trigger={
              <button className="p-1 rounded hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)]">
                <MoreHorizontal size={12} />
              </button>
            }
            align="right"
          >
            <Dropdown.Item icon={Plus} onClick={() => onAddSubpageRequest(page.id)}>
              Add subpage
            </Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item icon={Trash2} onClick={() => onDeleteRequest(page)} danger>
              Delete
            </Dropdown.Item>
          </Dropdown>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div>
          {page.children.map((child) => (
            <PageTreeItem 
              key={child.id} 
              page={child} 
              siteId={siteId}
              level={level + 1}
              onDeleteRequest={onDeleteRequest}
              onAddSubpageRequest={onAddSubpageRequest}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Site Item Component
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

// Main Unified Sidebar
function UnifiedSidebar({ isOpen, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { siteId } = useParams();
  const { user, logout } = useAuthStore();
  const { sites, fetchSites, createSite, currentSite } = useSiteStore();
  const { pages, fetchPages, createPage, deletePage, isLoading: pagesLoading } = usePageStore();
  const { theme, toggleTheme } = useTheme();
  
  const isDark = theme === 'dark';
  const isInSite = location.pathname.startsWith('/sites/') && siteId;
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [pageToDelete, setPageToDelete] = useState(null);
  const [parentIdForNewPage, setParentIdForNewPage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Site creation modal state
  const [showCreateSiteModal, setShowCreateSiteModal] = useState(false);

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  useEffect(() => {
    if (siteId) {
      fetchPages(siteId);
    }
  }, [siteId, fetchPages]);

  const activeSiteId = location.pathname.startsWith('/sites/') 
    ? location.pathname.split('/')[2] 
    : null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAddPage = () => {
    setParentIdForNewPage(null);
    setShowAddModal(true);
  };

  const handleAddSubpage = (parentId) => {
    setParentIdForNewPage(parentId);
    setShowAddModal(true);
  };

  const handleCreatePage = async (title) => {
    setIsSubmitting(true);
    try {
      await createPage(siteId, { 
        title, 
        content: {},
        parent_id: parentIdForNewPage 
      });
      setShowAddModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRequest = (page) => {
    setPageToDelete(page);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!pageToDelete) return;
    setIsSubmitting(true);
    try {
      await deletePage(siteId, pageToDelete.id);
      setShowDeleteModal(false);
      setPageToDelete(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle create new site
  const handleCreateSite = async (name) => {
    setIsSubmitting(true);
    try {
      const result = await createSite({ name });
      if (result.success && result.data?.id) {
        setShowCreateSiteModal(false);
        navigate(`/sites/${result.data.id}`);
      }
    } finally {
      setIsSubmitting(false);
    }
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
        w-[260px] bg-[var(--color-bg-secondary)] border-r border-[var(--color-border-primary)]
        flex flex-col
        transition-transform duration-200 ease-out
        lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header - User Section */}
        <div className="p-3 border-b border-[var(--color-border-primary)]">
          <div className="flex items-center gap-2.5">
            {user?.avatar_url ? (
              <img 
                src={user.avatar_url} 
                alt={user.name}
                className="w-8 h-8 rounded-full ring-2 ring-[var(--color-border-secondary)]"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-accent)] to-teal-500 flex items-center justify-center text-white text-xs font-medium">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{user?.name}</p>
              <p className="text-[10px] text-[var(--color-text-muted)] truncate">{user?.email}</p>
            </div>
            
            {/* Mobile Close */}
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)]"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto p-2">
          {isInSite ? (
            /* === SITE VIEW: Show Pages === */
            <>
              {/* Back to Home */}
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 w-full px-2.5 py-1.5 mb-2 text-[13px] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] rounded-lg transition-colors"
              >
                <ChevronRight size={14} className="rotate-180" />
                <span>Back to Home</span>
              </button>

              {/* Current Site Header */}
              <div className="flex items-center gap-2 px-2.5 py-2 mb-2 bg-[var(--color-bg-tertiary)] rounded-lg">
                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[var(--color-accent)] to-teal-500 flex items-center justify-center">
                  <Sparkles size={12} className="text-white" />
                </div>
                <span className="text-sm font-semibold text-[var(--color-text-primary)] truncate flex-1">
                  {currentSite?.name || 'Loading...'}
                </span>
                
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => setShowPublishModal(true)}
                    className={`p-1 rounded hover:bg-[var(--color-bg-hover)] transition-colors ${currentSite?.is_published ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'}`}
                    title={currentSite?.is_published ? "Site is Live" : "Publish Site"}
                  >
                    <Globe size={14} />
                  </button>
                  <button
                    onClick={() => navigate(`/sites/${siteId}/settings`)}
                    className="p-1 rounded hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)]"
                  >
                    <Settings size={14} />
                  </button>
                </div>
              </div>

              {/* Pages Section */}
              <div className="flex items-center justify-between px-2 py-1 mb-1">
                <span className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                  Pages
                </span>
                <button 
                  onClick={handleAddPage}
                  className="p-1 rounded hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Page Tree */}
              {pagesLoading ? (
                <div className="py-6 text-center">
                  <div className="w-full h-0.5 bg-[var(--color-bg-hover)] overflow-hidden rounded-full">
                    <div className="h-full bg-[var(--color-accent)]/50 w-1/3 animate-pulse" />
                  </div>
                </div>
              ) : pages.length === 0 ? (
                <div className="py-8 text-center">
                  <FileText size={24} className="mx-auto mb-2 text-[var(--color-text-muted)] opacity-50" />
                  <p className="text-xs text-[var(--color-text-muted)]">No pages yet</p>
                  <button 
                    onClick={handleAddPage}
                    className="mt-2 text-[var(--color-accent)] text-xs hover:underline"
                  >
                    Create one?
                  </button>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {pages.map((page) => (
                    <PageTreeItem 
                      key={page.id} 
                      page={page} 
                      siteId={siteId}
                      onDeleteRequest={handleDeleteRequest}
                      onAddSubpageRequest={handleAddSubpage}
                    />
                  ))}
                </div>
              )}

              {/* Other Sites Section - when in site view */}
              <div className="mt-4 pt-4 border-t border-[var(--color-border-secondary)]">
                <div className="flex items-center justify-between px-2 py-1 mb-1">
                  <span className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                    Other Sites
                  </span>
                  <button
                    onClick={() => setShowCreateSiteModal(true)}
                    className="p-0.5 hover:bg-[var(--color-bg-hover)] rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                    title="Create new site"
                  >
                    <Plus size={12} />
                  </button>
                </div>
                <div className="space-y-0.5">
                  {sites.filter(s => s.id !== siteId).slice(0, 5).map((site) => (
                    <SiteItem 
                      key={site.id} 
                      site={site} 
                      isActive={false}
                    />
                  ))}
                  {sites.filter(s => s.id !== siteId).length === 0 && (
                    <button 
                      onClick={() => setShowCreateSiteModal(true)}
                      className="w-full px-2.5 py-2 text-center text-xs text-[var(--color-accent)] hover:underline"
                    >
                      + Create new site
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* === HOME VIEW: Show Sites === */
            <>
              <NavLink 
                to="/" 
                className={({ isActive }) => `
                  flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium mb-2
                  transition-all duration-150
                  ${isActive 
                    ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]' 
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]'
                  }
                `}
              >
                <Home size={16} />
                <span>Home</span>
              </NavLink>

              {/* Sites Section */}
              <div className="pt-2">
                <div className="flex items-center justify-between px-2.5 py-1 mb-1">
                  <span className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                    Your Sites
                  </span>
                  <button
                    onClick={() => setShowCreateSiteModal(true)}
                    className="p-0.5 hover:bg-[var(--color-bg-hover)] rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                    title="Create new site"
                  >
                    <Plus size={12} />
                  </button>
                </div>

                <div className="space-y-0.5">
                  {sites.length === 0 ? (
                    <div className="px-2.5 py-6 text-center">
                      <Layers size={28} className="mx-auto text-[var(--color-text-muted)] opacity-50 mb-2" />
                      <p className="text-xs text-[var(--color-text-muted)]">No sites yet</p>
                      <button 
                        onClick={() => setShowCreateSiteModal(true)}
                        className="mt-2 text-[var(--color-accent)] text-xs hover:underline"
                      >
                        Create one?
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
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-[var(--color-border-primary)] space-y-0.5">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-[13px] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
            <span>{isDark ? 'Light mode' : 'Dark mode'}</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-[13px] text-[var(--color-text-secondary)] hover:bg-[var(--color-danger)]/10 hover:text-[var(--color-danger)] transition-colors"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Modals */}
      <InputModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleCreatePage}
        title={parentIdForNewPage ? "Add Subpage" : "Add New Page"}
        message="Enter a title for your page."
        placeholder="e.g. Getting Started"
        submitText="Create"
        isLoading={isSubmitting}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setPageToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Page"
        message={`Are you sure you want to delete "${pageToDelete?.title}"?`}
        confirmText="Delete"
        variant="danger"
        isLoading={isSubmitting}
      />

      {/* Create Site Modal */}
      <InputModal
        isOpen={showCreateSiteModal}
        onClose={() => setShowCreateSiteModal(false)}
        onSubmit={handleCreateSite}
        title="Create New Site"
        message="Enter a name for your documentation site."
        placeholder="e.g. My Documentation"
        submitText="Create Site"
        isLoading={isSubmitting}
      />

      {/* Publish Modal */}
      <PublishModal 
        isOpen={showPublishModal} 
        onClose={() => setShowPublishModal(false)}
        site={currentSite}
      />
    </>
  );
}

export default UnifiedSidebar;
