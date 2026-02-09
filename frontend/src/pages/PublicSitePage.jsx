import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, ChevronRight, Menu, X, ExternalLink, Sparkles, Home, Layers } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import PageViewer from '../components/pages/PageViewer';
import client from '../api/client';

// Flatten nested pages
function flattenPages(pages, parentId = null) {
  let result = [];
  for (const page of pages) {
    result.push(page);
    if (page.children && page.children.length > 0) {
      result = result.concat(flattenPages(page.children, page.id));
    }
  }
  return result;
}

function PageTreeItem({ page, allPages, currentPageId, onSelect, depth = 0 }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const children = allPages.filter(p => p.parent_id === page.id);
  const hasChildren = children.length > 0;
  const isActive = page.id === currentPageId;

  return (
    <div>
      <button
        onClick={() => onSelect(page)}
        className={`
          w-full flex items-center gap-2 px-3 py-2 rounded-lg
          text-left transition-all duration-200
          ${isActive 
            ? 'bg-emerald-500/20 text-emerald-400 border-l-2 border-emerald-400' 
            : 'hover:bg-white/5 text-gray-400 hover:text-white border-l-2 border-transparent'
          }
        `}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
      >
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-0.5 hover:bg-white/10 rounded transition-colors"
          >
            <ChevronRight 
              size={14} 
              className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            />
          </button>
        )}
        {!hasChildren && <span className="w-4" />}
        <FileText size={14} className="shrink-0" />
        <span className="truncate flex-1 text-sm">{page.title || 'Untitled'}</span>
      </button>

      {hasChildren && isExpanded && (
        <div>
          {children
            .sort((a, b) => a.order - b.order)
            .map(child => (
              <PageTreeItem
                key={child.id}
                page={child}
                allPages={allPages}
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

function PublicSitePage() {
  const { identifier, spaceSlug, pageSlug } = useParams();
  const navigate = useNavigate();
  const [site, setSite] = useState(null);
  const [spaces, setSpaces] = useState([]);
  const [currentSpace, setCurrentSpace] = useState(null);
  const [pages, setPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchSiteData();
  }, [identifier, spaceSlug, pageSlug]);

  const fetchSiteData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch site info
      const siteRes = await client.get(`/public/sites/${identifier}`);
      const siteData = siteRes.data.data;
      setSite(siteData);
      setSpaces(siteData.spaces || []);

      // Determine which space to show
      let targetSpace = null;
      if (spaceSlug) {
        targetSpace = siteData.spaces.find(s => s.id === spaceSlug || s.slug === spaceSlug);
      } else {
        // Find home space or first space
        targetSpace = siteData.spaces.find(s => s.is_home) || siteData.spaces[0];
      }

      if (targetSpace) {
        setCurrentSpace(targetSpace);
        
        // Fetch pages for this space
        const pagesRes = await client.get(`/public/sites/${identifier}/spaces/${targetSpace.id}/pages`);
        const pageList = flattenPages(pagesRes.data.data || []);
        setPages(pageList);

        // Determine which page to show
        if (pageSlug) {
          const targetPage = pageList.find(p => p.id === pageSlug || p.slug === pageSlug);
          if (targetPage) {
            await loadPageContent(targetPage);
          }
        } else if (pageList.length > 0) {
          const firstPage = pageList.find(p => !p.parent_id) || pageList[0];
          await loadPageContent(firstPage);
        }
      }
    } catch (err) {
      console.error(err);
      setError('This documentation is not available or has been made private.');
    }
    
    setIsLoading(false);
  };

  const loadPageContent = async (page) => {
    try {
      const pageRes = await client.get(`/public/sites/${identifier}/spaces/${currentSpace?.id || page.space_id}/pages/${page.id}`);
      setCurrentPage(pageRes.data.data || pageRes.data);
    } catch (err) {
      setCurrentPage(page);
    }
  };

  const handleSpaceSelect = async (space) => {
    setCurrentSpace(space);
    setSidebarOpen(false);
    
    try {
      const pagesRes = await client.get(`/public/sites/${identifier}/spaces/${space.id}/pages`);
      const pageList = flattenPages(pagesRes.data.data || []);
      setPages(pageList);
      
      if (pageList.length > 0) {
        const firstPage = pageList.find(p => !p.parent_id) || pageList[0];
        await loadPageContent(firstPage);
      } else {
        setCurrentPage(null);
      }
    } catch (err) {
      console.error('Failed to load space pages:', err);
    }
  };

  const handlePageSelect = async (page) => {
    setSidebarOpen(false);
    await loadPageContent(page);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d1117]">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-500 text-sm">Loading documentation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d1117]">
        <div className="text-center max-w-md px-6">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-red-500/10 flex items-center justify-center">
            <span className="text-4xl">🔒</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">
            Documentation Unavailable
          </h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  const rootPages = pages.filter(p => !p.parent_id).sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen bg-[#0d1117]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0d1117]/95 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile menu */}
            <button
              className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-white/10 text-gray-400 transition-colors"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-linear-to-br from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Sparkles size={16} className="text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-white text-sm leading-tight">
                  {site?.name}
                </h1>
                <p className="text-[10px] text-gray-500">E-Docs</p>
              </div>
            </div>
          </div>

          {/* Right side */}
          <a 
            href="/"
            className="text-xs text-gray-500 hover:text-emerald-400 transition-colors flex items-center gap-1"
          >
            Create your own <ExternalLink size={10} />
          </a>
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto">
        {/* Sidebar */}
        <aside className={`
          fixed lg:sticky top-14 left-0 z-30
          w-72 bg-[#0d1117] lg:bg-transparent
          border-r border-white/5 lg:border-0
          h-[calc(100vh-3.5rem)] overflow-y-auto
          transform lg:transform-none transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <nav className="p-4">
            {/* Spaces Navigation */}
            {spaces.length > 1 && (
              <div className="mb-6">
                <p className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Sections
                </p>
                <div className="space-y-1">
                  {spaces.map(space => (
                    <button
                      key={space.id}
                      onClick={() => handleSpaceSelect(space)}
                      className={`
                        w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                        transition-all
                        ${currentSpace?.id === space.id 
                          ? 'bg-emerald-500/20 text-emerald-400' 
                          : 'text-gray-400 hover:bg-white/5 hover:text-white'}
                      `}
                    >
                      <Layers size={14} />
                      <span className="truncate">{space.label || space.name}</span>
                      {space.is_home && <Home size={10} className="text-emerald-400" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Pages */}
            <div>
              <p className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {currentSpace?.label || currentSpace?.name || 'Pages'}
              </p>
              <div className="space-y-0.5">
                {rootPages.map(page => (
                  <PageTreeItem
                    key={page.id}
                    page={page}
                    allPages={pages}
                    currentPageId={currentPage?.id}
                    onSelect={handlePageSelect}
                  />
                ))}
              </div>
            </div>
          </nav>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/60 z-20 lg:hidden backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-h-[calc(100vh-3.5rem)]">
          <article className="max-w-3xl mx-auto px-6 py-12">
            {currentPage ? (
              <>
                {/* Page title */}
                <h1 className="text-4xl font-bold text-white mb-2">
                  {currentPage.title || 'Untitled'}
                </h1>
                
                {/* Meta */}
                {currentPage.updated_at && (
                  <p className="text-sm text-gray-500 mb-8">
                    Last updated {new Date(currentPage.updated_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                )}

                {/* Content */}
                <div className="prose prose-invert prose-emerald max-w-none">
                  <PageViewer content={currentPage.content} />
                </div>

                {/* Page navigation */}
                <div className="mt-16 pt-8 border-t border-white/10">
                  <div className="flex justify-between">
                    {/* Previous page */}
                    <div>
                      {pages.findIndex(p => p.id === currentPage.id) > 0 && (
                        <button
                          onClick={() => handlePageSelect(pages[pages.findIndex(p => p.id === currentPage.id) - 1])}
                          className="text-left group"
                        >
                          <p className="text-xs text-gray-500 mb-1">Previous</p>
                          <p className="text-emerald-400 group-hover:text-emerald-300 transition-colors">
                            ← {pages[pages.findIndex(p => p.id === currentPage.id) - 1]?.title}
                          </p>
                        </button>
                      )}
                    </div>
                    
                    {/* Next page */}
                    <div className="text-right">
                      {pages.findIndex(p => p.id === currentPage.id) < pages.length - 1 && (
                        <button
                          onClick={() => handlePageSelect(pages[pages.findIndex(p => p.id === currentPage.id) + 1])}
                          className="text-right group"
                        >
                          <p className="text-xs text-gray-500 mb-1">Next</p>
                          <p className="text-emerald-400 group-hover:text-emerald-300 transition-colors">
                            {pages[pages.findIndex(p => p.id === currentPage.id) + 1]?.title} →
                          </p>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-20">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
                  <FileText size={32} className="text-gray-600" />
                </div>
                <p className="text-gray-500">
                  {pages.length === 0 
                    ? 'This section has no pages yet'
                    : 'Select a page from the sidebar to start reading'}
                </p>
              </div>
            )}
          </article>
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between text-xs text-gray-600">
          <p>Powered by E-Docs</p>
          <p>© {new Date().getFullYear()} {site?.name}</p>
        </div>
      </footer>
    </div>
  );
}

export default PublicSitePage;
