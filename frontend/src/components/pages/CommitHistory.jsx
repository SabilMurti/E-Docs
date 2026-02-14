import { useState, useEffect } from 'react';
import { GitCommit, User, Clock, ChevronDown, ChevronUp, FileCode } from 'lucide-react';
import { getCommits } from '../../api/pages';
import client from '../../api/client';
import LoadingSpinner from '../common/LoadingSpinner';
import DiffViewer from '../editor/DiffViewer';

export default function CommitHistory({ requestId }) {
  const [commits, setCommits] = useState([]);
  const [requestDetail, setRequestDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCommitId, setExpandedCommitId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch request details to get base_content
        const requestRes = await client.get(`/requests/${requestId}`);
        setRequestDetail(requestRes.data);

        // Fetch commits
        const commitsData = await getCommits(requestId);
        setCommits(commitsData);
      } catch (error) {
        console.error("Failed to fetch commit history", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (requestId) fetchData();
  }, [requestId]);

  const toggleExpand = (id) => {
    setExpandedCommitId(expandedCommitId === id ? null : id);
  };

  if (isLoading) return <div className="py-12 flex justify-center"><LoadingSpinner /></div>;

  if (commits.length === 0) {
    return (
      <div className="py-12 text-center text-[color:var(--color-text-muted)]">
        <GitCommit size={48} className="mx-auto mb-4 opacity-20" />
        <p>No commits found for this request.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-[color:var(--color-border-primary)] opacity-50" />
        
        <div className="space-y-6">
          {commits.map((commit, index) => {
            const isExpanded = expandedCommitId === commit.id;
            
            // Determine base content for this commit diff
            // If it's the oldest commit (last in array), its base is the request's base_content
            // Otherwise, its base is the commit immediately after it in the array (the previous commit in time)
            const baseContentForThisDiff = (index === commits.length - 1)
              ? requestDetail?.base_content
              : commits[index + 1]?.content;

            return (
              <div key={commit.id} className="relative pl-12 group">
                {/* Node */}
                <div className="absolute left-[13px] top-1.5 w-[10px] h-[10px] rounded-full bg-[color:var(--color-bg-primary)] border-2 border-blue-500 z-10" />
                
                <div className={`bg-[color:var(--color-bg-secondary)] border ${isExpanded ? 'border-blue-500 ring-1 ring-blue-500/20' : 'border-[color:var(--color-border-primary)] hover:border-blue-500/50'} rounded-xl overflow-hidden shadow-sm transition-all`}>
                  {/* Header UI */}
                  <div 
                    className="px-4 py-3 cursor-pointer flex items-start justify-between gap-4"
                    onClick={() => toggleExpand(commit.id)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <FileCode size={12} className="text-blue-400" />
                        <h4 className="text-[13px] font-bold text-[color:var(--color-text-primary)]">
                          {commit.message}
                        </h4>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-[color:var(--color-text-muted)]">
                        <div className="flex items-center gap-1">
                          <User size={12} />
                          <span>{commit.user?.name || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={12} />
                          <span>{new Date(commit.created_at).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-end shrink-0">
                        <code className="px-2 py-0.5 rounded bg-black/20 text-[10px] text-blue-400 font-mono border border-blue-500/20">
                          {String(commit.id).slice(0, 7)}
                        </code>
                      </div>
                      <div className="text-[color:var(--color-text-muted)]">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>
                  </div>
                  
                  {/* Expanded Diff Area */}
                  {isExpanded && (
                    <div className="border-t border-[color:var(--color-border-primary)] bg-black/20">
                      <div className="px-4 py-2 bg-[color:var(--color-bg-tertiary)] border-b border-[color:var(--color-border-primary)] flex justify-between items-center">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-[color:var(--color-text-muted)]">
                          Changes in this commit
                        </span>
                        <span className="text-[10px] text-blue-400 animate-pulse">Comparing with {index === commits.length - 1 ? 'original' : 'previous'}</span>
                      </div>
                      <div className="p-4 overflow-hidden">
                        <DiffViewer 
                          oldContent={baseContentForThisDiff} 
                          newContent={commit.content} 
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
