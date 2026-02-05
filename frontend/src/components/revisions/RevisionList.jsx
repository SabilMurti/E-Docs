import { useState, useEffect, useMemo } from 'react';
import { GitCommit, RotateCcw, FileCode, Clock, User, FileText, ChevronDown, ChevronRight } from 'lucide-react';
import * as Diff from 'diff';
import { getRevisions, getRevision, restoreRevision } from '../../api/revisions';
import { formatRelativeTime, formatDate, extractTiptapText } from '../../utils/helpers';
import LoadingSpinner from '../common/LoadingSpinner';

function RevisionItem({ revision, previousRevision, spaceId, pageId, isFirst, onRestored }) {
  const [isExpanded, setIsExpanded] = useState(isFirst);
  const [isRestoring, setIsRestoring] = useState(false);
  const [fullDiffTexts, setFullDiffTexts] = useState({ oldText: '', newText: '' });
  const [isLoadingDiff, setIsLoadingDiff] = useState(false);

  // Fetch content on expand if missing
  useEffect(() => {
    if (!isExpanded) return;

    const loadContent = async () => {
      setIsLoadingDiff(true);
      try {
        let oldContent = previousRevision?.content;
        let newContent = revision.content;

        // Fetch previous revision content if missing and it exists
        if (previousRevision && !oldContent && previousRevision.id !== 'current') {
           const res = await getRevision(spaceId, pageId, previousRevision.id);
           oldContent = res.data?.content || res.content;
        }

        // Fetch current revision content if missing (unlikely for 'current' but possible for others)
        if (!newContent && revision.id !== 'current') {
           const res = await getRevision(spaceId, pageId, revision.id);
           newContent = res.data?.content || res.content;
        }

        const oldTextStr = oldContent ? extractTiptapText(oldContent) : '';
        const newTextStr = newContent ? extractTiptapText(newContent) : '';
        
        setFullDiffTexts({
          oldText: oldTextStr,
          newText: newTextStr
        });
      } catch (error) {
        console.error("Failed to load revision content", error);
      } finally {
        setIsLoadingDiff(false);
      }
    };

    loadContent();
  }, [isExpanded, revision.id, previousRevision?.id, spaceId, pageId]);

  const diffParts = useMemo(() => {
    if (!isExpanded || isLoadingDiff) return [];
    return Diff.diffLines(fullDiffTexts.oldText, fullDiffTexts.newText);
  }, [isExpanded, isLoadingDiff, fullDiffTexts]);

  const handleRestore = async () => {
    if (!confirm('Are you sure you want to restore this version? Current content will be overwritten.')) return;
    
    setIsRestoring(true);
    try {
      await restoreRevision(spaceId, pageId, revision.id);
      if (onRestored) onRestored();
    } catch (error) {
      console.error('Failed to restore:', error);
      alert('Failed to restore revision');
    }
    setIsRestoring(false);
  };
// ... rest of component until return
  const user = revision.user || revision.updater || {};
  const userName = user.name || 'Unknown User';
  const userAvatar = user.avatar_url;
  const shortHash = revision.id === 'current' ? 'latest' : revision.id.substring(0, 7);
  const commitMessage = revision.isCurrentVersion 
    ? `Current content of ${revision.title || 'untitled page'}`
    : (revision.change_summary || `Updated ${revision.title || 'page'} content`);

  return (
    <div className="border border-[var(--color-border)] rounded-md mb-4 bg-[var(--color-bg-primary)] overflow-hidden">
      {/* Header / Commit Row */}
      <div 
        className="flex items-start justify-between p-3 gap-4 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)] cursor-pointer hover:bg-[var(--color-bg-tertiary)] transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex gap-3 min-w-0 flex-1">
          <button className="mt-0.5 text-[var(--color-text-secondary)]">
             {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          
          <div className="flex flex-col gap-1 min-w-0">
             <div className="flex items-center gap-2">
                <span className="font-semibold text-[var(--color-text-primary)] text-sm truncate">
                  {commitMessage}
                </span>
                {revision.isCurrentVersion && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium border border-green-200 dark:border-green-800">
                    Latest
                  </span>
                )}
             </div>
             <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                {userAvatar && <img src={userAvatar} className="w-4 h-4 rounded-full" />}
                <span className="font-medium">{userName}</span>
                <span>committed {formatRelativeTime(revision.created_at)}</span>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <span className="font-mono text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-tertiary)] px-2 py-1 rounded border border-[var(--color-border)]">
              {shortHash}
           </span>
           {!revision.isCurrentVersion && (
              <button
                onClick={(e) => { e.stopPropagation(); handleRestore(); }}
                disabled={isRestoring}
                className="p-1.5 hover:bg-[var(--color-bg-tertiary)] rounded text-[var(--color-text-secondary)]"
                title="Restore this version"
              >
                {isRestoring ? <LoadingSpinner size="sm" /> : <RotateCcw size={16} />}
              </button>
           )}
        </div>
      </div>

      {/* Expanded Diff View - GitHub Style */}
      {isExpanded && (
        <div className="bg-[var(--color-bg-primary)] text-sm font-mono">
           {isLoadingDiff ? (
             <div className="flex justify-center p-8">
               <LoadingSpinner />
             </div>
           ) : (
             <>
               {/* File Header Bar */}
               <div className="flex items-center justify-between px-4 py-2 bg-[var(--color-bg-tertiary)] border-b border-[var(--color-border)] text-xs text-[var(--color-text-secondary)]">
                  <div className="flex items-center gap-2">
                     <FileText size={14} />
                     <span className="font-medium">{revision.title || 'Page Content'}</span>
                  </div>
                  <div className="flex gap-4">
                     <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                        +{diffParts.reduce((acc, p) => p.added ? acc + p.count : acc, 0)} additions
                     </span>
                     <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                        -{diffParts.reduce((acc, p) => p.removed ? acc + p.count : acc, 0)} deletions
                     </span>
                  </div>
               </div>
    
               {/* Diff Content */}
               <div className="overflow-x-auto">
                  <div className="min-w-full divide-y-0 text-xs leading-5">
                    {diffParts.length > 0 ? diffParts.map((part, i) => {
                      const lines = part.value.replace(/\n$/, '').split('\n');
                      return lines.map((line, j) => {
                        const isAdded = part.added;
                        const isRemoved = part.removed;
                        
                        // GitHub Style Colors
                        const rowClass = isAdded 
                          ? 'bg-[#e6ffec] dark:bg-[rgba(46,160,67,0.15)] block w-full'
                          : isRemoved 
                            ? 'bg-[#ffebe9] dark:bg-[rgba(248,81,73,0.15)] block w-full' 
                            : 'bg-white dark:bg-[#0d1117] block w-full hover:bg-[var(--color-bg-tertiary)]';
                        
                        const gutterClass = isAdded
                          ? 'bg-[#ccffd8] dark:bg-[rgba(46,160,67,0.3)] text-[var(--color-text-secondary)] border-r border-transparent'
                          : isRemoved
                            ? 'bg-[#ffd7d5] dark:bg-[rgba(248,81,73,0.3)] text-[var(--color-text-secondary)] border-r border-transparent'
                            : 'bg-transparent text-[var(--color-text-muted)] border-r border-[var(--color-border)]';
                            
                        const textClass = isAdded
                          ? 'text-[#24292f] dark:text-[#e6edf3]'
                          : isRemoved
                            ? 'text-[#24292f] dark:text-[#e6edf3]'
                            : 'text-[var(--color-text-primary)]';
    
                        return (
                          <div key={`${i}-${j}`} className={`flex ${rowClass}`}>
                             {/* Gutter (Symbol) */}
                             <div className={`w-10 flex-shrink-0 select-none text-center py-0.5 ${gutterClass} opacity-70`}>
                               {isAdded ? '+' : isRemoved ? '-' : ''}
                             </div>
                             {/* Content */}
                             <div className={`flex-1 px-4 py-0.5 whitespace-pre-wrap break-all ${textClass}`}>
                               {line || <br />}
                             </div>
                          </div>
                        );
                      });
                    }) : (
                       <div className="p-8 text-center text-[var(--color-text-muted)] italic">
                          No text changes detected
                       </div>
                    )}
                  </div>
               </div>
             </>
           )}
        </div>
      )}
    </div>
  );
}

function RevisionList({ spaceId, pageId, currentPage, onRestoreSuccess }) {
  const [revisions, setRevisions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRevisions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getRevisions(spaceId, pageId);
      setRevisions(response.data || response);
    } catch (err) {
      setError('Failed to load revision history');
      console.error(err);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (spaceId && pageId) {
      fetchRevisions();
    }
  }, [spaceId, pageId, currentPage?.updated_at]);

  const handleRestored = () => {
    fetchRevisions();
    if (onRestoreSuccess) {
      onRestoreSuccess();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-[var(--color-text-secondary)]">
        {error}
      </div>
    );
  }

  // Construct current version object
  const currentVersion = currentPage ? {
    id: 'current',
    title: currentPage.title,
    content: currentPage.content,
    created_at: currentPage.updated_at,
    user: currentPage.updated_by,
    isCurrentVersion: true
  } : null;

  const allRevisions = currentVersion ? [currentVersion, ...revisions] : revisions;

  if (allRevisions.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock size={48} className="mx-auto text-[var(--color-text-muted)] mb-4" />
        <h3 className="text-lg font-medium text-[var(--color-text-primary)]">
          No history available
        </h3>
        <p className="text-[var(--color-text-secondary)] mt-2">
          Make changes to your page to see history here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border)] mb-6">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
          <GitCommit />
          Commits
        </h3>
        <span className="text-sm text-[var(--color-text-secondary)]">
          {allRevisions.length} stored revisions
        </span>
      </div>
      
      <div>
        {allRevisions.map((revision, index) => (
          <RevisionItem
            key={revision.id}
            revision={revision}
            previousRevision={allRevisions[index + 1]}
            spaceId={spaceId}
            pageId={pageId}
            isFirst={index === 0}
            onRestored={handleRestored}
          />
        ))}
      </div>
    </div>
  );
}

export default RevisionList;
