import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GitPullRequest, ArrowLeft, CheckCircle, XCircle, User, Calendar, ExternalLink } from 'lucide-react';
import useSiteStore from '../../stores/siteStore';
import useAuthStore from '../../stores/authStore';
import client from '../../api/client';
import LoadingSpinner from '../common/LoadingSpinner';
import Button from '../common/Button';
import { toast } from 'sonner';

function MergeRequestDetailPage() {
  const { siteId, requestId } = useParams();
  const navigate = useNavigate();
  const { currentSite, fetchSite } = useSiteStore();
  const { user } = useAuthStore();
  const [mr, setMr] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMerging, setIsMerge] = useState(false);

  useEffect(() => {
    const fetchMr = async () => {
      try {
        const response = await client.get(`/sites/${siteId}/merge-requests/${requestId}`);
        setMr(response.data.mr);
      } catch (error) {
        toast.error('Failed to load MR');
        navigate(`/sites/${siteId}/merge-requests`);
      } finally {
        setIsLoading(false);
      }
    };

    if (siteId && requestId) {
      if (!currentSite) fetchSite(siteId);
      fetchMr();
    }
  }, [siteId, requestId, currentSite, fetchSite, navigate]);

  const handleMerge = async () => {
    if (!constim('Are you sure you want to merge these changes? This cannot be undone easily.')) return;
    
    setIsMerge(true);
    try {
      await client.post(`/sites/${siteId}/merge-requests/${requestId}/merge`);
      toast.success('Merged successfully!');
      // Refresh
      const response = await client.get(`/sites/${siteId}/merge-requests/${requestId}`);
      setMr(response.data.mr);
    } catch (error) {
      toast.error('Merge failed: ' + (error.response?.data?.message || 'Unknown error'));
    } finally {
      setIsMerge(false);
    }
  };

  if (isLoading || !mr) {
    return (
      <div className="flex justify-center p-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Permission Logic
  // Target Branch Creator OR Site Admin
  // We need target branch creator ID.
  // The API response includes `target_branch`.
  // Wait, `Branch` model has `created_by`. Does `load('targetBranch')` include it? Yes.
  const canMerge = 
    currentSite?.can_merge || // Site Owner/Admin (from my previous canMerge logic on Site model)
    (mr.target_branch?.created_by === user?.id);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-6">
        <Button size="sm" onClick={() => navigate(`/sites/${siteId}/merge-requests`)} className="bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] p-0 mb-4 flex items-center gap-2">
          <ArrowLeft size={14} />
          Back to Requests
        </Button>
        
        <div className="flex items-start justify-between gap-4">
           <div>
              <div className="flex items-center gap-3 mb-2">
                 <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
                    {mr.title} <span className="text-[var(--color-text-muted)] font-normal">#{mr.id.substring(0,8)}</span>
                 </h1>
                 <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                      mr.status === 'open' ? 'bg-green-500/10 text-green-500' :
                      mr.status === 'merged' ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]' :
                      'bg-gray-500/10 text-gray-500'
                    }`}>
                      {mr.status}
                 </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] mb-4">
                 <span>Requesting merge from</span>
                 <span className="font-mono bg-[var(--color-bg-tertiary)] px-1.5 py-0.5 rounded text-[var(--color-text-primary)]">{mr.source_branch?.name}</span>
                 <span>into</span>
                 <span className="font-mono bg-[var(--color-bg-tertiary)] px-1.5 py-0.5 rounded text-[var(--color-text-primary)]">{mr.target_branch?.name}</span>
              </div>
           </div>
           
           {mr.status === 'open' && (
             <Button 
               onClick={handleMerge} 
               disabled={isMerging || !canMerge}
               className={`${canMerge ? 'bg-green-600 hover:bg-green-500 text-white' : 'opacity-50 cursor-not-allowed'}`}
             >
               {isMerging ? 'Merging...' : 'Merge Pull Request'}
             </Button>
           )}
        </div>

        {!canMerge && mr.status === 'open' && (
           <div className="bg-yellow-500/10 text-yellow-500 text-xs px-3 py-2 rounded mb-4 inline-block">
              Only the target branch owner ({mr.target_branch?.name}) or site admin can merge this.
           </div>
        )}

      </div>

      <div className="grid grid-cols-3 gap-6">
         <div className="col-span-2 space-y-6">
            <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-primary)] rounded-xl p-6">
               <h3 className="font-semibold text-[var(--color-text-primary)] mb-4">Description</h3>
               <p className="text-[var(--color-text-secondary)] whitespace-pre-wrap">
                 {mr.description || 'No description provided.'}
               </p>
            </div>
            
            <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-primary)] rounded-xl p-6">
               <div className="flex items-center justify-between mb-4">
                 <h3 className="font-semibold text-[var(--color-text-primary)]">Changed Pages</h3>
                 <span className="text-xs text-[var(--color-text-muted)]">Comparison not fully implemented yet</span>
               </div>
               {/* 
                 TODO: List changed pages here. 
                 Since backend `calculateChangedPages` returns empty array for now, functionality is limited. 
               */}
               <div className="text-center py-8 text-[var(--color-text-muted)] italic">
                  Diff view coming soon.
               </div>
            </div>
         </div>
         
         <div className="space-y-4">
            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-4">
               <h4 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">Details</h4>
               <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                     <span className="text-[var(--color-text-secondary)]">Author</span>
                     <div className="flex items-center gap-2">
                        <User size={14} className="text-[var(--color-text-muted)]" />
                        <span className="font-medium text-[var(--color-text-primary)]">{mr.author?.name}</span>
                     </div>
                  </div>
                  <div className="flex items-center justify-between">
                     <span className="text-[var(--color-text-secondary)]">Created</span>
                     <span className="text-[var(--color-text-primary)]">{new Date(mr.created_at).toLocaleDateString()}</span>
                  </div>
                  {mr.merged_by && (
                    <div className="flex items-center justify-between">
                       <span className="text-[var(--color-text-secondary)]">Merged by</span>
                       <span className="font-medium text-[var(--color-text-primary)]">{mr.merged_by?.name}</span>
                    </div>
                  )}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}

function constim(msg) {
  return window.confirm(msg);
}

export default MergeRequestDetailPage;
