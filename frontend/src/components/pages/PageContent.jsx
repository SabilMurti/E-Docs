import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Save, Clock, Check, History, Printer, ChevronRight, Eye, Edit2 } from 'lucide-react';
import usePageStore from '../../stores/pageStore';
import TiptapEditor from '../editor/TiptapEditor';
import PageViewer from './PageViewer';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';

// Helper to find path through tree
const findPagePath = (nodes, targetId) => {
  for (const node of nodes) {
    if (node.id === targetId) return [node];
    if (node.children) {
      const path = findPagePath(node.children, targetId);
      if (path) return [node, ...path];
    }
  }
  return null;
};

function PageContent() {
  const { spaceId, pageId } = useParams();
  const navigate = useNavigate();
  const { pages, currentPage, fetchPage, updatePage, isLoading, isSaving } = usePageStore();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Compute breadcrumbs
  const breadcrumbs = useMemo(() => {
    if (!pages || !pageId) return [];
    return findPagePath(pages, pageId) || [];
  }, [pages, pageId]);

  // Fetch page on mount
  useEffect(() => {
    if (spaceId && pageId) {
      fetchPage(spaceId, pageId);
    }
  }, [spaceId, pageId, fetchPage]);

  // Update local state when page loads
  useEffect(() => {
    if (currentPage) {
      setTitle(currentPage.title || '');
      setContent(currentPage.content || {});
      setHasChanges(false);
      setIsPreviewMode(false); // Reset preview mode on page change
    }
  }, [currentPage]);

  // Handle content change
  const handleContentChange = useCallback((newContent) => {
    setContent(newContent);
    setHasChanges(true);
  }, []);

  // Handle title change
  const handleTitleChange = (e) => {
    setTitle(e.target.value);
    setHasChanges(true);
  };

  // Save page
  const handleSave = async () => {
    if (!spaceId || !pageId) return;
    
    const result = await updatePage(spaceId, pageId, { title, content });
    if (result.success) {
      setHasChanges(false);
      setLastSaved(new Date());
    } else {
      alert(`Failed to save page: ${result.error}`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Auto-save on Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (hasChanges) handleSave();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [hasChanges, handleSave]);

  if (isLoading && !currentPage) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!currentPage) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-center">
        <p className="text-[var(--color-text-muted)]">
          Select a page from the sidebar to start editing
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-8 py-8">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] mb-4 no-print overflow-x-auto whitespace-nowrap">
        <Link to={`/spaces/${spaceId}`} className="hover:text-[var(--color-text-primary)] transition-colors">
          Document
        </Link>
        {breadcrumbs.map((crumb) => (
          <div key={crumb.id} className="flex items-center gap-1.5">
            <ChevronRight size={14} className="text-[var(--color-text-muted)] mt-0.5" />
            <Link 
              to={`/spaces/${spaceId}/pages/${crumb.id}`}
              className={`hover:text-[var(--color-text-primary)] transition-colors ${crumb.id === pageId ? 'font-medium text-[var(--color-text-primary)]' : ''}`}
            >
              {crumb.title}
            </Link>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6 no-print">
        <div className="flex items-center gap-3 text-sm text-[var(--color-text-muted)]">
          {!isPreviewMode && (
            <>
              {lastSaved && (
                <span className="flex items-center gap-1">
                  <Check size={14} className="text-[var(--color-success)]" />
                  Saved {lastSaved.toLocaleTimeString()}
                </span>
              )}
              {hasChanges && (
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  Unsaved changes
                </span>
              )}
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            title={isPreviewMode ? "Back to Edit" : "Preview Mode"}
          >
            {isPreviewMode ? <Edit2 size={16} /> : <Eye size={16} />}
            {isPreviewMode ? 'Edit' : 'Preview'}
          </Button>
          {!isPreviewMode && (
             <Button
               variant="ghost"
               size="sm"
               onClick={handlePrint}
               title="Print / Export to PDF"
             >
               <Printer size={16} />
               Export
             </Button>
          )}
          {!isPreviewMode && (
            <Button 
              variant="primary" 
              size="sm"
              onClick={handleSave}
              isLoading={isSaving}
              disabled={!hasChanges}
            >
              <Save size={16} />
              Save
            </Button>
          )}
        </div>
      </div>

      {/* Title & Editor / Preview */}
      {isPreviewMode ? (
        <div className="animate-fadeIn">
           <h1 className="text-4xl font-bold text-[var(--color-text-primary)] mb-8">
             {title || 'Untitled'}
           </h1>
           <div className="text-[var(--color-text-primary)]">
             <PageViewer content={content} />
           </div>
        </div>
      ) : (
        <div className="animate-fadeIn">
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Untitled"
            className="
              w-full mb-6 px-0
              text-4xl font-bold
              bg-transparent
              text-[var(--color-text-primary)]
              placeholder:text-[var(--color-text-muted)]
              border-none outline-none
            "
          />

          <TiptapEditor
            content={content}
            onChange={handleContentChange}
            placeholder="Start writing your documentation..."
          />
        </div>
      )}
    </div>
  );
}

export default PageContent;
