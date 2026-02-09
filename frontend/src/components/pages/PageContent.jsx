import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Check, History, Settings, Eye, Edit3, Save,
  Image as ImageIcon, ChevronRight, MoreHorizontal, Menu
} from 'lucide-react';
import usePageStore from '../../stores/pageStore';
import useSiteStore from '../../stores/siteStore';
import PageEditor from '../editor/PageEditor';
import LoadingSpinner from '../common/LoadingSpinner';

export default function PageContent() {
  const { pageId, siteId } = useParams();
  const navigate = useNavigate();
  
  const { currentPage, fetchPage, updatePage, isLoading, isSaving } = usePageStore();
  const { currentSite } = useSiteStore();
  
  const [mode, setMode] = useState('edit'); // 'edit' | 'preview'
  const [localContent, setLocalContent] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  // Fetch page on mount
  useEffect(() => {
    if (siteId && pageId) {
      fetchPage(siteId, pageId);
    }
  }, [siteId, pageId, fetchPage]);

  // Set local content when page loads
  useEffect(() => {
    if (currentPage?.content) {
      setLocalContent(currentPage.content);
      setHasUnsavedChanges(false);
    }
  }, [currentPage]);

  // Handle content changes
  const handleContentChange = useCallback((newContent) => {
    setLocalContent(newContent);
    setHasUnsavedChanges(true);
  }, []);

  // Save page
  const handleSave = useCallback(async () => {
    if (!siteId || !currentPage || !localContent) return;
    
    const result = await updatePage(siteId, currentPage.id, {
      content: localContent
    });
    
    if (result.success) {
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
    }
  }, [siteId, currentPage, localContent, updatePage]);

  // Auto-save with debounce
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    
    const timer = setTimeout(() => {
      handleSave();
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [localContent, hasUnsavedChanges, handleSave]);

  // Keyboard shortcut for save
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  // Breadcrumbs
  const breadcrumbs = useMemo(() => {
    const items = [];
    if (currentSite) {
      items.push({
        label: currentSite.name,
        href: `/sites/${currentSite.id}`
      });
    }
    if (currentPage) {
      items.push({
        label: currentPage.title,
        href: null
      });
    }
    return items;
  }, [currentSite, currentPage]);

  if (isLoading || !currentPage) {
    return (
      <div className="h-full flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Page Header */}
      <header className="sticky top-0 z-20 bg-[color:var(--color-bg-primary)] border-b border-[color:var(--color-border-primary)]">
        <div className="flex items-center justify-between px-4 h-12">
          {/* Left: Breadcrumbs */}
          <nav className="flex items-center gap-1 text-sm">
            {breadcrumbs.map((crumb, index) => (
              <div key={index} className="flex items-center gap-1">
                {index > 0 && (
                  <ChevronRight size={14} className="text-[color:var(--color-text-muted)]" />
                )}
                {crumb.href ? (
                  <Link 
                    to={crumb.href}
                    className="text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-text-primary)] transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-[color:var(--color-text-primary)] font-medium">
                    {crumb.label}
                  </span>
                )}
              </div>
            ))}
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Save Status */}
            {isSaving ? (
              <span className="text-xs text-[color:var(--color-text-muted)] flex items-center gap-1">
                <LoadingSpinner size="sm" />
                Saving...
              </span>
            ) : hasUnsavedChanges ? (
              <span className="text-xs text-[color:var(--color-warning)] flex items-center gap-1">
                Unsaved changes
              </span>
            ) : lastSaved && (
              <span className="text-xs text-[color:var(--color-text-muted)] flex items-center gap-1">
                <Check size={12} />
                Saved
              </span>
            )}

            {/* Mode Toggle */}
            <div className="flex items-center bg-[color:var(--color-bg-secondary)] rounded-lg p-0.5">
              <button
                onClick={() => setMode('edit')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                  mode === 'edit'
                    ? 'bg-[color:var(--color-bg-primary)] text-[color:var(--color-text-primary)] shadow-sm'
                    : 'text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-text-primary)]'
                }`}
              >
                <Edit3 size={12} />
                Edit
              </button>
              <button
                onClick={() => setMode('preview')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                  mode === 'preview'
                    ? 'bg-[color:var(--color-bg-primary)] text-[color:var(--color-text-primary)] shadow-sm'
                    : 'text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-text-primary)]'
                }`}
              >
                <Eye size={12} />
                Preview
              </button>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={!hasUnsavedChanges || isSaving}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[color:var(--color-accent)] text-white hover:bg-[color:var(--color-accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <Save size={12} />
              Save
            </button>

            {/* History */}
            <button
              onClick={() => navigate(`/sites/${siteId}/pages/${pageId}/history`)}
              className="p-1.5 rounded-lg text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-primary)] hover:bg-[color:var(--color-bg-hover)] transition-colors"
              title="Version History"
            >
              <History size={16} />
            </button>

            {/* More Options */}
            <button
              className="p-1.5 rounded-lg text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-primary)] hover:bg-[color:var(--color-bg-hover)] transition-colors"
              title="More Options"
            >
              <MoreHorizontal size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Page Title & Icon */}
      <div className="px-4 py-6 md:px-16 lg:px-24 xl:px-32 border-b border-[color:var(--color-border-secondary)]">
        <div className="max-w-3xl mx-auto">
          {/* Page Icon */}
          <div className="mb-4">
            <button className="w-12 h-12 rounded-xl bg-[color:var(--color-bg-secondary)] border border-[color:var(--color-border-primary)] hover:border-[color:var(--color-border-hover)] transition-colors flex items-center justify-center group">
              {currentPage.icon ? (
                <span className="text-2xl">{currentPage.icon}</span>
              ) : (
                <ImageIcon size={20} className="text-[color:var(--color-text-muted)] group-hover:text-[color:var(--color-text-secondary)]" />
              )}
            </button>
          </div>

          {/* Page Title */}
          <h1 className="text-3xl font-bold text-[color:var(--color-text-primary)]">
            {currentPage.title}
          </h1>
        </div>
      </div>

      {/* Editor / Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-6 md:px-16 lg:px-24 xl:px-32">
          <div className="max-w-3xl mx-auto">
            {mode === 'edit' ? (
              <PageEditor
                content={localContent}
                onChange={handleContentChange}
                editable={true}
              />
            ) : (
              <PageEditor
                content={localContent}
                onChange={() => {}}
                editable={false}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
