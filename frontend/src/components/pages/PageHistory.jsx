import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getPage } from '../../api/pages';
import RevisionList from '../revisions/RevisionList';
import LoadingSpinner from '../common/LoadingSpinner';

function PageHistory() {
  const { spaceId, pageId } = useParams();
  const [currentPage, setCurrentPage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPage = async () => {
    try {
      const res = await getPage(spaceId, pageId);
      setCurrentPage(res.data || res);
    } catch (error) {
      console.error("Failed to load page", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (spaceId && pageId) fetchPage();
  }, [spaceId, pageId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center gap-4 mb-8 border-b border-[var(--color-border)] pb-4">
        <Link 
          to={`/spaces/${spaceId}/pages/${pageId}`} 
          className="p-2 hover:bg-[var(--color-bg-secondary)] rounded-full transition-colors text-[var(--color-text-secondary)]"
          title="Back to Page"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Version History
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            History for <span className="font-medium text-[var(--color-text-primary)]">{currentPage?.title}</span>
          </p>
        </div>
      </div>

      <RevisionList 
        spaceId={spaceId}
        pageId={pageId}
        currentPage={currentPage}
        onRestoreSuccess={() => {
           // Refetch page logic to update "Current Version" display
           fetchPage();
        }}
      />
    </div>
  );
}

export default PageHistory;
