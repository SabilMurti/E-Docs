import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Sparkles } from 'lucide-react';
import useSiteStore from '../stores/siteStore';
import usePageStore from '../stores/pageStore';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';
import PageContent from '../components/pages/PageContent';

// Welcome/Dashboard page when no page is selected
function SiteDashboard({ site, pages, onCreatePage, isCreating }) {
  const navigate = useNavigate();

  if (!pages || pages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <div className="w-14 h-14 rounded-xl bg-[var(--color-accent)] flex items-center justify-center shadow-lg mb-4">
          <Sparkles size={24} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
          Welcome to {site?.name}
        </h1>
        <p className="text-[var(--color-text-muted)] text-sm max-w-md mb-6">
          This is the home of your documentation site. Select a page from the sidebar to start editing, or create your first page below.
        </p>
        <Button onClick={onCreatePage} loading={isCreating}>
          <Plus size={16} />
          Create First Page
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] flex items-center gap-3">
             {site?.name}
             {site?.is_published && (
               <span className="text-[10px] px-2 py-0.5 bg-[var(--color-accent)]/10 text-[var(--color-accent)] rounded-full uppercase tracking-tighter border border-[var(--color-accent)]/20">
                 Live
               </span>
             )}
          </h1>
          <p className="text-[var(--color-text-muted)] mt-1">{site?.description || 'Site Dashboard'}</p>
        </div>
        <div className="flex items-center gap-3">
           {site?.can_edit && (
             <Button onClick={onCreatePage} loading={isCreating}>
               <Plus size={16} />
               New Page
             </Button>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="col-span-full border-b border-[var(--color-border-secondary)] pb-4 mb-2">
           <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider flex items-center gap-2">
             <Plus size={14} /> All Pages
           </h2>
        </div>
        
        {pages.map((page) => (
          <button
            key={page.id}
            onClick={() => navigate(`/sites/${site.id}/pages/${page.id}`)}
            className="group flex flex-col p-5 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] hover:border-[var(--color-accent)]/30 hover:shadow-xl transition-all text-left relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <Plus className="text-[var(--color-accent)] rotate-45" size={16} />
            </div>
            
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--color-bg-tertiary)] flex items-center justify-center text-[var(--color-text-primary)] group-hover:bg-[var(--color-accent)]/20 group-hover:text-[var(--color-accent)] transition-colors">
                {page.icon ? <span className="text-lg">{page.icon}</span> : <Plus size={18} />}
              </div>
              <h3 className="font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors truncate">
                {page.title}
              </h3>
            </div>
            
            <p className="text-xs text-[var(--color-text-muted)] line-clamp-2 mb-4">
              {page.excerpt || 'No description available for this page.'}
            </p>
            
            <div className="mt-auto pt-4 border-t border-[var(--color-border-secondary)] flex items-center justify-between text-[10px] text-[var(--color-text-muted)]">
              <span>Updated {new Date(page.updated_at).toLocaleDateString()}</span>
              {page.children?.length > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-[var(--color-bg-tertiary)]">
                  {page.children.length} sub-pages
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function SitePage() {
  const { siteId, pageId } = useParams();
  const { currentSite, fetchSite, isLoading: siteLoading } = useSiteStore();
  const { pages, fetchPages, createPage } = usePageStore();
  const [isCreating, setIsCreating] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (siteId && !hasFetched.current) {
      hasFetched.current = true;
      Promise.all([
        fetchSite(siteId),
        fetchPages(siteId)
      ]).finally(() => {
        setInitialLoading(false);
      });
    }
  }, [siteId, fetchSite, fetchPages]);

  // Reset when siteId changes
  useEffect(() => {
    hasFetched.current = false;
    setInitialLoading(true);
  }, [siteId]);

  const handleCreatePage = async () => {
    setIsCreating(true);
    try {
      await createPage(siteId, {
        title: 'Untitled Page',
        content: {}
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Only show loading on initial fetch, not when PageContent fetches a page
  if (initialLoading && !pageId) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--color-bg-primary)]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // If pageId exists, render PageContent
  if (pageId) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)]">
        <PageContent />
      </div>
    );
  }

  // No page selected, show dashboard (with all pages)
  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      <SiteDashboard 
        site={currentSite} 
        pages={pages}
        onCreatePage={handleCreatePage}
        isCreating={isCreating}
      />
    </div>
  );
}

export default SitePage;
