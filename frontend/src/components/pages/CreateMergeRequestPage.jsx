
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  GitPullRequest, ArrowLeft, CheckCircle2, AlertCircle, 
  GitCompare, FileText, FilePlus, FileMinus, FileDiff, ArrowRight
} from 'lucide-react';
import useSiteStore from '../../stores/siteStore';
import { compareBranches } from '../../api/sites';
import client from '../../api/client';
import LoadingSpinner from '../common/LoadingSpinner';
import Button from '../common/Button';
import { toast } from 'sonner';

function CreateMergeRequestPage() {
  const { siteId } = useParams();
  const navigate = useNavigate();
  const { currentSite, fetchSite, fetchBranches, branches, currentBranch } = useSiteStore();
  
  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Compare State
  const [isChecking, setIsChecking] = useState(false);
  const [mergeStatus, setMergeStatus] = useState('initial'); // initial, able, conflict, identical, error
  const [diffData, setDiffData] = useState(null);

  // Initial Load
  useEffect(() => {
    if (siteId) {
      const init = async () => {
        if (!currentSite) await fetchSite(siteId);
        await fetchBranches(siteId);
        setIsLoading(false);
      };
      init();
    }
  }, [siteId, currentSite, fetchSite, fetchBranches]);

  // Set default branches
  useEffect(() => {
    if (branches.length > 0 && !sourceId && !targetId) {
      const current = branches.find(b => b.name === currentBranch);
      const main = branches.find(b => b.name === 'main');
      
      // Default: Compare Current -> Main
      // If current is main, look for another branch?
      if (current && current.name !== 'main') {
          setSourceId(current.id);
          setTargetId(main?.id || branches[0].id);
      } else {
          // If on main, compare [First Other Branch] -> Main
          const other = branches.find(b => b.name !== 'main');
          if (other) {
             setSourceId(other.id);
             setTargetId(main?.id || branches[0].id);
          } else {
             // Only main exists
             setSourceId(branches[0].id);
             setTargetId(branches[0].id);
          }
      }
    }
  }, [branches, sourceId, targetId, currentBranch]);

  // Run Comparison when selection changes
  const runComparison = useCallback(async () => {
    if (!sourceId || !targetId) return;
    if (sourceId === targetId) {
        setMergeStatus('identical');
        setDiffData(null);
        return;
    }

    setIsChecking(true);
    setMergeStatus('checking');
    try {
        const data = await compareBranches(siteId, sourceId, targetId);
        setDiffData(data);
        if (data.can_merge) {
            setMergeStatus(data.status === 'identical' ? 'identical' : 'able');
        } else {
            setMergeStatus('conflict');
        }

        // Auto-fill title if empty
        if (!title && data.files_changed?.length > 0) {
            const sourceName = branches.find(b => b.id === sourceId)?.name;
            setTitle(`Merge ${sourceName} into ${branches.find(b => b.id === targetId)?.name}`);
        }
    } catch (error) {
        setMergeStatus('error');
        console.error(error);
    } finally {
        setIsChecking(false);
    }
  }, [siteId, sourceId, targetId, title, branches]);

  // Debounce comparison or run on effect
  useEffect(() => {
      runComparison();
  }, [sourceId, targetId]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sourceId || !targetId || !title) return;
    if (mergeStatus !== 'able') {
        toast.error('Cannot create merge request: Branches are identical or conflicting.');
        return;
    }

    setIsSubmitting(true);
    try {
      const response = await client.post(`/sites/${siteId}/merge-requests`, {
        source_branch_id: sourceId,
        target_branch_id: targetId,
        title,
        description,
      });
      toast.success('Merge Request created!');
      navigate(`/sites/${siteId}/merge-requests/${response.data.id}`);
    } catch (error) {
      toast.error('Failed to create MR: ' + (error.response?.data?.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const getStatusColor = () => {
      switch(mergeStatus) {
          case 'able': return 'text-green-600';
          case 'conflict': return 'text-red-600';
          case 'identical': return 'text-gray-500';
          default: return 'text-gray-500';
      }
  };

  const getStatusIcon = () => {
      switch(mergeStatus) {
          case 'able': return <CheckCircle2 size={16} className="text-green-600" />;
          case 'conflict': return <AlertCircle size={16} className="text-red-600" />;
          case 'identical': return <AlertCircle size={16} className="text-gray-500" />; // Or info icon
          default: return <LoadingSpinner size="sm" />;
      }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-normal text-[var(--color-text-primary)] mb-4">
          Comparing changes
        </h1>
        
        {/* Branch Selector Bar */}
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-md flex items-center p-3 gap-3 flex-wrap">
            <GitCompare size={18} className="text-[var(--color-text-muted)]" />
            
            {/* Target Selector */}
            <div className="flex items-center gap-2">
                <span className="text-sm text-[var(--color-text-muted)]">base:</span>
                <select 
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                    className="bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded px-2 py-1 text-sm font-medium focus:outline-none focus:border-[var(--color-accent)]"
                >
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
            </div>

            <ArrowLeft size={16} className="text-[var(--color-text-muted)]" />

            {/* Source Selector */}
            <div className="flex items-center gap-2">
                <span className="text-sm text-[var(--color-text-muted)]">compare:</span>
                <select 
                    value={sourceId}
                    onChange={(e) => setSourceId(e.target.value)}
                    className="bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded px-2 py-1 text-sm font-medium focus:outline-none focus:border-[var(--color-accent)]"
                >
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
            </div>

            {/* Status Indicator */}
            <div className={`flex items-center gap-2 text-sm font-medium ml-auto ${getStatusColor()} ${isChecking ? 'opacity-50' : ''}`}>
                {isChecking ? <LoadingSpinner size="sm" /> : getStatusIcon()}
                <span>
                    {mergeStatus === 'able' && 'Able to merge.'}
                    {mergeStatus === 'conflict' && "Can't automatically merge."}
                    {mergeStatus === 'identical' && 'Branches are identical.'}
                    {mergeStatus === 'checking' && 'Checking mergeability...'}
                </span>
            </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left: Form */}
          <div className="lg:col-span-3 space-y-6">
             <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-primary)] rounded-lg p-1">
                 <form onSubmit={handleSubmit}>
                    <div className="p-4 border-b border-[var(--color-border-secondary)]">
                        <input 
                            type="text" 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Title"
                            className="w-full bg-transparent text-lg font-semibold placeholder-[var(--color-text-muted)] focus:outline-none"
                            required
                            disabled={mergeStatus !== 'able'}
                        />
                    </div>
                    <div className="p-4">
                        <textarea 
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Leave a comment"
                            rows={6}
                            className="w-full bg-transparent resize-none placeholder-[var(--color-text-muted)] focus:outline-none"
                            disabled={mergeStatus !== 'able'}
                        />
                    </div>
                    <div className="p-4 bg-[var(--color-bg-secondary)] border-t border-[var(--color-border-primary)] flex justify-end gap-3 rounded-b-lg">
                        <Button 
                            type="submit" 
                            disabled={mergeStatus !== 'able' || isSubmitting} 
                            loading={isSubmitting}
                            className={mergeStatus === 'able' ? 'bg-green-600 hover:bg-green-700 text-white border-transparent' : ''}
                        >
                            Create pull request
                        </Button>
                    </div>
                 </form>
             </div>

             {/* Diff Summary */}
             {diffData && diffData.files_changed?.length > 0 && (
                 <div className="border border-[var(--color-border-primary)] rounded-lg overflow-hidden">
                     <div className="bg-[var(--color-bg-secondary)] px-4 py-2 border-b border-[var(--color-border-primary)] flex justify-between items-center">
                         <h3 className="text-sm font-semibold flex items-center gap-2">
                             <FileDiff size={16} />
                             {diffData.files_changed.length} file{diffData.files_changed.length !== 1 ? 's' : ''} changed
                         </h3>
                         <div className="flex gap-3 text-xs">
                             <span className="text-green-600 font-medium">+{diffData.stats.added} added</span>
                             <span className="text-yellow-600 font-medium">~{diffData.stats.modified} modified</span>
                             <span className="text-red-600 font-medium">-{diffData.stats.deleted} deleted</span>
                         </div>
                     </div>
                     <div className="divide-y divide-[var(--color-border-secondary)]">
                         {diffData.files_changed.map((file, idx) => (
                             <div key={idx} className="px-4 py-3 flex items-center gap-3 hover:bg-[var(--color-bg-hover)]">
                                 {file.type === 'added' && <FilePlus size={16} className="text-green-600" />}
                                 {file.type === 'modified' && <FileText size={16} className="text-yellow-600" />}
                                 {file.type === 'deleted' && <FileMinus size={16} className="text-red-600" />}
                                 
                                 <span className="flex-1 text-sm font-medium">{file.title}</span>
                                 <span className="text-xs text-[var(--color-text-muted)] font-mono">{file.type}</span>
                             </div>
                         ))}
                     </div>
                 </div>
             )}
          </div>

          {/* Right: Metadata (Sidebar) */}
          <div className="space-y-6">
              <div className="border-b border-[var(--color-border-secondary)] pb-4">
                  <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase mb-2">Reviewers</h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">No reviewers</p>
              </div>
              <div className="border-b border-[var(--color-border-secondary)] pb-4">
                  <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase mb-2">Assignees</h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">No one assigned</p>
              </div>
              <div className="border-b border-[var(--color-border-secondary)] pb-4">
                  <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase mb-2">Labels</h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">None yet</p>
              </div>
          </div>

      </div>
    </div>
  );
}

export default CreateMergeRequestPage;


