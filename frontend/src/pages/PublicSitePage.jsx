import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, ChevronRight, Menu, X, ExternalLink, Sparkles } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import PageViewer from '../components/pages/PageViewer';
import client from '../api/client';

// Recursive Tree Item
function PageTreeItem({ page, allPages, currentPageId, onSelect, depth = 0 }) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Find children in the flat list
  const children = allPages
    .filter(p => p.parent_id === page.id)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
    
  const hasChildren = children.length > 0;
  const isActive = page.id === currentPageId || page.slug === currentPageId;

  return (
    <div>
      <div
        className={`
          group flex items-center gap-2 px-3 py-1.5 rounded-lg
          transition-colors cursor-pointer select-none
          ${isActive 
            ? 'bg-emerald-500/10 text-emerald-400' 
            : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
          }
        `}
        style={{ paddingLeft: `${12 + depth * 12}px` }}
        onClick={() => onSelect(page)}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-0.5 hover:bg-white/10 rounded transition-colors"
          >
            <ChevronRight 
              size={12} 
              className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
            />
          </button>
        ) : (
          <span className="w-4" />
        )}
        
        {page.icon && <span className="text-sm shrink-0">{page.icon}</span>}
        {!page.icon && <FileText size={14} className="shrink-0 opacity-70" />}
        
        <span className="truncate flex-1 text-sm font-medium">{page.title || 'Untitled'}</span>
      </div>

      {hasChildren && isExpanded && (
        <div className="mt-0.5">
          {children.map(child => (
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

export default function PublicSitePage() {
  const { identifier, pageSlug } = useParams();
  const navigate = useNavigate();
  
  const [site, setSite] = useState(null);
  const [pages, setPages] = useState([]); // Flat list of all published pages
  const [currentPage, setCurrentPage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSiteAndPages();
  }, [identifier]);

  // Handle URL change for pageSlug
  useEffect(() => {
    if (pages.length > 0) {
      if (pageSlug) {
        // Find page by slug or ID
        const target = pages.find(p => p.slug === pageSlug || p.id === pageSlug);
        if (target) {
          loadPageContent(target);
        } else {
          // Page not found in valid pages list? Maybe try fetching ID directly if needed
          // For now, redirect or show error
        }
      } else {
        // No slug, load first root page
        const firstRoot = pages.filter(p => !p.parent_id).sort((a,b) => (a.order||0)-(b.order||0))[0];
        if (firstRoot) {
          loadPageContent(firstRoot);
        }
      }
    }
  }, [pageSlug, pages]);

  const fetchSiteAndPages = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Get Site & Flat Pages List
      const res = await client.get(`/public/sites/${identifier}`);
      const siteData = res.data.data;
      
      setSite(siteData);
      setPages(siteData.pages || []);
      
    } catch (err) {
      console.error(err);
      setError('This documentation is not available or private.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPageContent = async (page) => {
    if (currentPage?.id === page.id && currentPage.content) return; // Already loaded

    try {
      // 2. Get Full Page Content
      // Use slug or ID for URL. Route supports /pages/:pageId
      // Let's use ID to be safe
      const res = await client.get(`/public/sites/${identifier}/pages/${page.id}`);
      const fullPage = res.data.data;
      setCurrentPage(fullPage);
    } catch (err) {
      console.error("Failed to load content", err);
    }
  };

  const handlePageSelect = (page) => {
    setSidebarOpen(false);
    // Update URL
    // Use slug if available, else ID
    navigate(`/public/${identifier}/${page.slug || page.id}`);
  };

  if (isLoading && !site) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d1117] text-white">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d1117] text-white p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto bg-red-500/10 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">🔒</span>
          </div>
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <a href="/" className="px-4 py-2 bg-emerald-600 rounded-lg hover:bg-emerald-500 transition-colors">
            Go Home
          </a>
        </div>
      </div>
    );
  }

  // Root pages for sidebar
  const rootPages = pages
    .filter(p => !p.parent_id)
    .sort((a,b) => (a.order||0) - (b.order||0));

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0d1117]/80 backdrop-blur-md border-b border-gray-800 h-14">
        <div className="h-full px-4 max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              className="lg:hidden p-2 -ml-2 text-gray-400 hover:text-white"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-900/20">
                {site?.logo_url ? (
                   <img src={site.logo_url} alt="" className="w-full h-full object-cover rounded-lg" />
                ) : (
                   <Sparkles size={16} className="text-white" />
                )}
              </div>
              <div>
                <h1 className="text-sm font-bold text-white leading-tight">{site?.name}</h1>
                <p className="text-[10px] text-emerald-400 font-medium">Documentation</p>
              </div>
            </div>
          </div>

          <a href="/" className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-white transition-colors">
            Created with E-Docs <ExternalLink size={10} />
          </a>
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        {/* Sidebar */}
        <aside className={`
          fixed lg:sticky top-14 left-0 z-30
          h-[calc(100vh-3.5rem)] w-72 
          bg-[#0d1117] lg:bg-transparent border-r border-gray-800 lg:border-0
          overflow-y-auto transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="p-4 space-y-1">
             {rootPages.length === 0 ? (
               <p className="text-xs text-gray-500 text-center py-4">No content yet.</p>
             ) : (
               rootPages.map(page => (
                 <PageTreeItem 
                    key={page.id} 
                    page={page} 
                    allPages={pages} 
                    currentPageId={currentPage?.id}
                    onSelect={handlePageSelect}
                 />
               ))
             )}
          </div>
          
          {/* Mobile Overlay Closure Button */}
          <button 
            className="absolute top-4 right-4 lg:hidden text-gray-500"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </aside>

        {/* Mobile Backdrop */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/60 z-20 lg:hidden backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Content */}
        <main className="flex-1 min-w-0">
          <div className="max-w-3xl mx-auto px-6 py-10">
            {currentPage ? (
              <article className="animate-in fade-in duration-300">
                <header className="mb-8 pb-8 border-b border-gray-800">
                  <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
                    {currentPage.title || 'Untitled Page'}
                  </h1>
                  {currentPage.updated_at && (
                    <time className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                      Last updated {new Date(currentPage.updated_at).toLocaleDateString()}
                    </time>
                  )}
                </header>

                <div className="prose prose-invert prose-emerald max-w-none">
                  <PageViewer content={currentPage.content} />
                </div>
              </article>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
                   <FileText size={24} className="text-gray-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-300">Select a page</h3>
                <p className="text-gray-500 text-sm mt-1">Navigate using the sidebar to view content.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
