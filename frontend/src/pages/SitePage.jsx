import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Sparkles } from 'lucide-react';
import useSiteStore from '../stores/siteStore';
import usePageStore from '../stores/pageStore';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';
import PageContent from '../components/pages/PageContent';

// Welcome page when no page is selected
function WelcomePage({ site, onCreatePage, isCreating }) {
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

  // No page selected, show welcome page
  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      <WelcomePage 
        site={currentSite} 
        onCreatePage={handleCreatePage}
        isCreating={isCreating}
      />
    </div>
  );
}

export default SitePage;
