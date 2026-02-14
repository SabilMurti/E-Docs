import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Check, History, Settings, Eye, Edit3, Save,
  Image as ImageIcon, ChevronRight, MoreHorizontal, Menu, GitPullRequest,
  ArrowUpCircle, ArrowDownCircle
} from 'lucide-react';
import { toast } from 'sonner';
import usePageStore from '../../stores/pageStore';
import useSiteStore from '../../stores/siteStore';
import RichEditor from '../editor/RichEditor';
import LoadingSpinner from '../common/LoadingSpinner';
import PageViewer from './PageViewer';
import { createChangeRequest, syncChangeRequest } from '../../api/pages';

export default function PageContent() {
  const { pageId, siteId } = useParams();
  const navigate = useNavigate();
  
  const { currentPage, fetchPage, updatePage, isLoading, isSaving } = usePageStore();
  const { currentSite } = useSiteStore();
  
  const [mode, setMode] = useState('edit'); // 'edit' | 'preview'
  const [localContent, setLocalContent] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [draftSaving, setDraftSaving] = useState(false);

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

  // Manual Commit (Save to Self)
  const [commitMessage, setCommitMessage] = useState('');
  const [showCommitInput, setShowCommitInput] = useState(false);

  const handleCommit = useCallback(async () => {
    // Crucial: Use the most up-to-date content from the store/local state
    if (!currentPage || !localContent) {
      toast.error('No changes to commit');
      return;
    }
    
    setDraftSaving(true);
    try {
      const result = await usePageStore.getState().commitChange(siteId, currentPage.id, {
        content: localContent,
        title: currentPage.title, // Title might be editable in future
        message: commitMessage || 'Update content'
      });
      
      if (result.success) {
        setHasUnsavedChanges(false);
        setLastSaved(new Date());
        setShowCommitInput(false);
        setCommitMessage('');
        toast.success('Changes committed to your draft!');
      } else {
        toast.error(result.error || 'Failed to commit changes');
      }
    } catch (error) {
      console.error('Commit error:', error);
      toast.error('Failed to commit changes');
    } finally {
      setDraftSaving(false);
    }
  }, [currentPage, localContent, siteId, commitMessage]);

  const { currentRequest, fetchRequestDetails } = usePageStore();

  useEffect(() => {
    if (pageId) fetchRequestDetails(pageId);
  }, [pageId, fetchRequestDetails]);

  const isOutOfSync = useMemo(() => {
    if (!currentRequest || !currentPage) return false;
    return JSON.stringify(currentRequest.base_content) !== JSON.stringify(currentPage.content);
  }, [currentRequest, currentPage]);

  const handlePull = async () => {
    if (!currentRequest) return;
    setDraftSaving(true);
    try {
      await syncChangeRequest(currentRequest.id);
      await fetchRequestDetails(pageId);
      toast.success('Synced with latest live version (Git Pull)');
    } catch (error) {
       toast.error('Failed to sync changes');
    } finally {
      setDraftSaving(false);
    }
  };

  // Handle Request Review (Submit PR / Git Push)
  const handleRequestReview = useCallback(async () => {
    if (!currentPage) return;
    
    setDraftSaving(true);
    try {
      // Promote draft to 'open' and include latest content
      const result = await createChangeRequest(currentPage.id, {
        status: 'open',
        title: currentPage.title,
        content: localContent,
        description: 'Ready for review'
      });
      
      if (result) {
        setHasUnsavedChanges(false);
        toast.success('Changes pushed for review!');
        navigate(`/sites/${siteId}/pages/${pageId}/requests/${result.id}`);
      }
    } catch (error) {
      console.error('Failed to push changes:', error);
      toast.error('Failed to push changes');
    } finally {
      setDraftSaving(false);
    }
  }, [currentPage, localContent, siteId, pageId, navigate]);

  // Removed auto-save useEffect as per user request

  // Keyboard shortcut for save
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleRequestReview();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRequestReview]);

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
            {/* Save Status & Draft Indicator */}
            {draftSaving ? (
              <span className="text-xs text-[color:var(--color-text-muted)] flex items-center gap-1">
                <LoadingSpinner size="sm" />
                Saving draft...
              </span>
            ) : hasUnsavedChanges ? (
              <span className="text-xs text-[color:var(--color-warning)] flex items-center gap-1">
                Unsaved changes
              </span>
            ) : lastSaved && (
              <span className="text-xs text-[color:var(--color-text-muted)] flex items-center gap-1">
                <Check size={12} />
                Draft Saved
              </span>
            )}

            {/* Commit / Save progress */}
            <div className="flex items-center gap-2">
              {showCommitInput ? (
                <div className="flex items-center gap-2 animate-in slide-in-from-right-4 duration-300">
                  <input
                    type="text"
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    placeholder="Commit message..."
                    className="w-48 px-2 py-1.5 text-xs bg-[color:var(--color-bg-secondary)] border border-[color:var(--color-border-primary)] rounded-lg focus:outline-none focus:ring-1 focus:ring-[color:var(--color-accent)]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCommit();
                      if (e.key === 'Escape') setShowCommitInput(false);
                    }}
                    autoFocus
                  />
                  <button
                    onClick={handleCommit}
                    disabled={draftSaving}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[color:var(--color-accent)] text-white hover:bg-[color:var(--color-accent-hover)] transition-colors flex items-center gap-1"
                  >
                    {draftSaving ? <LoadingSpinner size="xs" /> : <Save size={12} />}
                    Commit
                  </button>
                  <button
                    onClick={() => setShowCommitInput(false)}
                    className="p-1.5 text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-primary)]"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowCommitInput(true)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                    hasUnsavedChanges 
                      ? 'bg-[color:var(--color-accent)] text-white hover:bg-[color:var(--color-accent-hover)] shadow-sm' 
                      : 'bg-[color:var(--color-bg-secondary)] text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-text-primary)]'
                  }`}
                >
                  <Save size={12} />
                  Commit
                </button>
              )}
            </div>

            {/* Git Pull (Sync) */}
            {isOutOfSync && (
              <button
                onClick={handlePull}
                disabled={draftSaving}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors flex items-center gap-1.5 shadow-sm"
                title="Your draft is out of sync with the live version. Pull changes."
              >
                <ArrowDownCircle size={14} />
                Pull
              </button>
            )}

            {/* Request Review Button */}
            <button
              onClick={handleRequestReview}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[color:var(--color-border-primary)] text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-bg-hover)] hover:text-[color:var(--color-text-primary)] transition-colors flex items-center gap-1.5"
              title="Push changes and request review"
            >
              <GitPullRequest size={14} />
              Request Review
            </button>

            {/* View Requests */}
            <button
              onClick={() => navigate(`/sites/${siteId}/pages/${pageId}/requests`)}
              className="p-1.5 rounded-lg text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-primary)] hover:bg-[color:var(--color-bg-hover)] transition-colors"
              title="View Requests & Drafts"
            >
              <GitPullRequest size={16} />
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
              <RichEditor
                content={localContent}
                onChange={handleContentChange}
                editable={true}
              />
            ) : (
              <div className="bg-[var(--color-bg-primary)] p-8 rounded-lg shadow-sm border border-[var(--color-border-secondary)] min-h-[500px]">
                <PageViewer content={localContent} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
