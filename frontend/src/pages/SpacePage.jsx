import { useEffect } from 'react';
import { useParams, Outlet } from 'react-router-dom';
import useSpaceStore from '../stores/spaceStore';
import usePageStore from '../stores/pageStore';
import Sidebar from '../components/layout/Sidebar';
import PageContent from '../components/pages/PageContent';
import LoadingSpinner from '../components/common/LoadingSpinner';
import PageHistory from '../components/pages/PageHistory';

function SpacePage({ historyMode = false }) {
  const { spaceId, pageId } = useParams();
  const { currentSpace, fetchSpace, isLoading: spaceLoading } = useSpaceStore();
  const { fetchPages, clearPages } = usePageStore();

  // Fetch space and pages on mount
  useEffect(() => {
    if (spaceId) {
      fetchSpace(spaceId);
      // Ensure pages are fetched for sidebar
      fetchPages(spaceId);
    }
    
    return () => {
      clearPages();
    };
  }, [spaceId, fetchSpace, fetchPages, clearPages]);

  if (spaceLoading && !currentSpace) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      {/* Sidebar */}
      <Sidebar spaceId={spaceId} />
      
      {/* Main Content */}
      <div className="ml-[var(--sidebar-width)]">
        {historyMode ? (
          <PageHistory />
        ) : pageId ? (
          <PageContent key={pageId} />
        ) : (
          /* Empty state when no page selected */
          <div className="flex flex-col items-center justify-center h-[calc(100vh-var(--navbar-height))] text-center px-4">
            <div className="
              w-16 h-16 mb-4
              bg-[var(--color-bg-secondary)]
              rounded-full flex items-center justify-center
            ">
              <svg 
                className="w-8 h-8 text-[var(--color-text-muted)]" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
              {currentSpace?.name || 'Documentation'}
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] max-w-md">
              Select a page from the sidebar to view or edit, 
              or create a new page to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default SpacePage;
