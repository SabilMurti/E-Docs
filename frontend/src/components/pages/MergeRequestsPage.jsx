import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GitPullRequest, GitMerge, Plus, Clock, CheckCircle, XCircle } from 'lucide-react';
import useSiteStore from '../../stores/siteStore';
import client from '../../api/client';
import LoadingSpinner from '../common/LoadingSpinner';
import Button from '../common/Button';

function MergeRequestsPage() {
  const { siteId } = useParams();
  const navigate = useNavigate();
  const { currentSite, fetchSite } = useSiteStore();
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await client.get(`/sites/${siteId}/merge-requests`);
        setRequests(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch MRs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (siteId) {
      if (!currentSite) fetchSite(siteId);
      fetchRequests();
    }
  }, [siteId, currentSite, fetchSite]);

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <GitPullRequest className="text-[var(--color-accent)]" />
            Merge Requests
          </h1>
          <p className="text-[var(--color-text-muted)] mt-1">
            Review and merge changes between branches.
          </p>
        </div>
        <Button onClick={() => navigate(`/sites/${siteId}/merge-requests/new`)}>
          <Plus size={16} />
          New Merge Request
        </Button>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-12 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border-primary)]">
          <GitPullRequest size={48} className="mx-auto text-[var(--color-text-muted)] mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-[var(--color-text-primary)]">No merge requests found</h3>
          <p className="text-[var(--color-text-muted)] mb-6">Create a merge request to merge changes from one branch to another.</p>
          <Button onClick={() => navigate(`/sites/${siteId}/merge-requests/new`)}>
            Create Merge Request
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((mr) => (
            <div 
              key={mr.id}
              onClick={() => navigate(`/sites/${siteId}/merge-requests/${mr.id}`)}
              className="group p-4 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] hover:border-[var(--color-accent)]/50 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      mr.status === 'open' ? 'bg-green-500/10 text-green-500' :
                      mr.status === 'merged' ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]' :
                      'bg-gray-500/10 text-gray-500'
                    }`}>
                      {mr.status}
                    </span>
                    <span className="text-xs text-[var(--color-text-muted)]">
                      #{mr.id.substring(0, 8)}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1 group-hover:text-[var(--color-accent)] transition-colors">
                    {mr.title}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                    <span className="flex items-center gap-1 font-mono text-xs bg-[var(--color-bg-tertiary)] px-1.5 py-0.5 rounded">
                      {mr.source_branch?.name}
                    </span>
                    <span className="text-[var(--color-text-muted)]">→</span>
                    <span className="flex items-center gap-1 font-mono text-xs bg-[var(--color-bg-tertiary)] px-1.5 py-0.5 rounded">
                      {mr.target_branch?.name}
                    </span>
                  </div>
                </div>
                
                <div className="text-right text-xs text-[var(--color-text-muted)]">
                  <div className="flex items-center gap-1 justify-end mb-1">
                    <span>Opened by</span>
                    <span className="font-medium text-[var(--color-text-primary)]">{mr.author?.name}</span>
                  </div>
                  <div className="flex items-center gap-1 justify-end">
                    <Clock size={12} />
                    <span>{new Date(mr.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MergeRequestsPage;
