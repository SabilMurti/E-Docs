import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FileText, ChevronRight, Menu, X } from 'lucide-react';
import { getPublicSpace, getPublicPages, getPublicPage } from '../api/public';
import LoadingSpinner from '../components/common/LoadingSpinner';

import PageViewer from '../components/pages/PageViewer';

function PageTreeItem({ page, pages, currentPageId, onSelect, depth = 0 }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const children = pages.filter(p => p.parent_id === page.id);
  const hasChildren = children.length > 0;
  const isActive = page.id === currentPageId;

  return (
    <div>
      <button
        onClick={() => onSelect(page)}
        className={`
          w-full flex items-center gap-2 px-3 py-2 rounded-lg
          text-left transition-colors
          ${isActive 
            ? 'bg-[var(--color-accent)] text-white' 
            : 'hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]'
          }
        `}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
      >
        {hasChildren && (
          <ChevronRight 
            size={14} 
            className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          />
        )}
        {!hasChildren && <span className="w-3.5" />}
        <FileText size={14} />
        <span className="truncate flex-1">{page.title || 'Untitled'}</span>
      </button>

      {hasChildren && isExpanded && (
        <div>
          {children
            .sort((a, b) => a.order - b.order)
            .map(child => (
              <PageTreeItem
                key={child.id}
                page={child}
                pages={pages}
                currentPageId={currentPageId}
                onSelect={onSelect}
                depth={depth + 1}
              />
            ))}
        </div>
      )}
    </div>
  );
}

function PublicSpacePage() {
  const { slug, pageSlug } = useParams();
  const [space, setSpace] = useState(null);
  const [pages, setPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch space info
        const spaceRes = await getPublicSpace(slug);
        setSpace(spaceRes.data || spaceRes);

        // Fetch pages
        const pagesRes = await getPublicPages(slug);
        const pageList = pagesRes.data || pagesRes;
        setPages(pageList);

        // If pageSlug provided, fetch that page
        if (pageSlug) {
          const pageRes = await getPublicPage(slug, pageSlug);
          setCurrentPage(pageRes.data || pageRes);
        } else if (pageList.length > 0) {
          // Default to first root page
          const firstPage = pageList.find(p => !p.parent_id) || pageList[0];
          setCurrentPage(firstPage);
        }
      } catch (err) {
        console.error(err);
        setError('This space is not available or has been made private.');
      }
      
      setIsLoading(false);
    };

    fetchData();
  }, [slug, pageSlug]);

  const handlePageSelect = async (page) => {
    setCurrentPage(page);
    setSidebarOpen(false);
    
    // Fetch full page content if needed
    if (!page.content) {
      try {
        const pageRes = await getPublicPage(slug, page.slug || page.id);
        setCurrentPage(pageRes.data || pageRes);
      } catch (err) {
        console.error('Failed to load page:', err);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-secondary)]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-secondary)]">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
            Space Not Available
          </h1>
          <p className="text-[var(--color-text-secondary)]">{error}</p>
        </div>
      </div>
    );
  }

  const rootPages = pages.filter(p => !p.parent_id).sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      {/* Header */}
      <header className="
        sticky top-0 z-40
        bg-[var(--color-bg-primary)] border-b border-[var(--color-border)]
        px-4 py-3
      ">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-[var(--color-bg-secondary)]"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div 
              className="
                w-8 h-8 rounded-lg
                bg-gradient-to-br from-[var(--color-accent)] to-blue-600
                flex items-center justify-center
              "
            >
              <span className="text-white font-bold text-sm">
                {space?.name?.charAt(0)?.toUpperCase() || 'S'}
              </span>
            </div>
            <h1 className="font-semibold text-[var(--color-text-primary)]">
              {space?.name}
            </h1>
          </div>
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto">
        {/* Sidebar */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-30
          w-64 bg-[var(--color-bg-primary)]
          border-r border-[var(--color-border)]
          transform lg:transform-none transition-transform
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          pt-16 lg:pt-4
        `}>
          <nav className="p-4 space-y-1">
            {rootPages.map(page => (
              <PageTreeItem
                key={page.id}
                page={page}
                pages={pages}
                currentPageId={currentPage?.id}
                onSelect={handlePageSelect}
              />
            ))}
          </nav>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-h-screen">
          <article className="max-w-3xl mx-auto px-6 py-12">
            {currentPage ? (
              <>
                <h1 className="text-4xl font-bold text-[var(--color-text-primary)] mb-8">
                  {currentPage.title || 'Untitled'}
                </h1>
                <div className="text-[var(--color-text-primary)]">
                  <PageViewer content={currentPage.content} />
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-[var(--color-text-muted)]">
                Select a page from the sidebar
              </div>
            )}
          </article>
        </main>
      </div>
    </div>
  );
}

export default PublicSpacePage;
