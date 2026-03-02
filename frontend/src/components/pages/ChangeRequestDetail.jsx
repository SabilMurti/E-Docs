import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GitPullRequest, ArrowLeft, Check, GitMerge, XCircle, Layers, FileText, Plus, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { getChangeRequests, mergeChangeRequest } from '../../api/pages';
import { getPage } from '../../api/pages';
import DiffViewer from '../editor/DiffViewer';
import BlockReviewer from '../editor/BlockReviewer';
import CommitHistory from './CommitHistory';
import RichEditor from '../editor/RichEditor';
import client from '../../api/client';
import LoadingSpinner from '../common/LoadingSpinner';
import ConfirmModal from '../common/ConfirmModal';
import ConflictResolver from './ConflictResolver';
import { AlertCircle } from 'lucide-react';
import useSiteStore from '../../stores/siteStore';
import usePageStore from '../../stores/pageStore';

async function getChangeRequestDetail(requestId) {
  const response = await client.get(`/requests/${requestId}`);
  return response.data;
}

export default function ChangeRequestDetail() {
  const { siteSlug, pageSlug, requestId } = useParams();
  const navigate = useNavigate();
  const { currentSite, fetchSite } = useSiteStore();
  const [pr, setPr] = useState(null); // Pull Request object
  const [changes, setChanges] = useState([]);
  const [selectedLogicalId, setSelectedLogicalId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMerging, setIsMerging] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('preview'); // 'preview' | 'diff' | 'pick' | 'conflict'
  const [showMergeConfirm, setShowMergeConfirm] = useState(false);
  const [pendingContent, setPendingContent] = useState(null);
  const [conflictData, setConflictData] = useState(null);

  // Fetch Site Data if missing (e.g. on refresh)
  useEffect(() => {
    if (siteSlug && (!currentSite || currentSite.slug !== siteSlug)) {
      fetchSite(siteSlug);
    }
  }, [siteSlug, currentSite, fetchSite]);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const data = await getChangeRequestDetail(requestId);
        // API returns {pull_request: {...}, changes: [...]}
        setPr(data.pull_request);
        const fetchedChanges = data.changes || [];
        setChanges(fetchedChanges);
        if (fetchedChanges.length > 0) {
            setSelectedLogicalId(fetchedChanges[0].logical_id);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load request details');
      } finally {
        setIsLoading(false);
      }
    };
    if (requestId) fetchDetail();
  }, [requestId, siteSlug, pageSlug]);

  const selectedChange = changes.find(c => c.logical_id === selectedLogicalId) || changes[0];

  const handleMergeClick = (content = null) => {
    // Crucial fix: React passes an event object by default if called from onClick.
    // We only want to set pendingContent if it's a legitimate Prosemirror-style doc object.
    if (content && typeof content === 'object' && content.type === 'doc') {
      setPendingContent(content);
    } else {
      setPendingContent(pr?.content);
    }
    setShowMergeConfirm(true);
  };

  const handleConfirmMerge = async () => {
    setIsMerging(true);
    setShowMergeConfirm(false); 
    
    try {
      await mergeChangeRequest(requestId, {});
      toast.success('Changes merged successfully!');
      navigate(`/sites/${siteSlug}/pages/${pageSlug}`);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 409) {
        setConflictData(err.response.data);
        setViewMode('conflict');
        toast.error('Conflict detected! Please resolve before merging.');
      } else {
        toast.error('Failed to merge changes: ' + (err.response?.data?.message || err.message));
      }
      setIsMerging(false);
    }
  };

  const handleResolveConflict = async (finalContent) => {
    setIsMerging(true);
    try {
      await mergeChangeRequest(requestId, {
        content: finalContent,
        title: pr?.title
      });
      toast.success('Conflict resolved and changes merged!');
      navigate(`/sites/${siteSlug}/pages/${pageSlug}`);
    } catch (err) {
      toast.error('Failed to resolve conflict: ' + err.message);
    } finally {
      setIsMerging(false);
    }
  };

  const handlePush = async () => {
    setIsMerging(true);
    try {
      await createChangeRequest(pageSlug, {
        status: 'open',
        title: pr?.title,
        content: pr?.content,
        description: pr?.description || 'Pushed from draft'
      });
      toast.success('Changes pushed for review!');
      // Refresh data
      const data = await getChangeRequestDetail(requestId);
      setPr(data.pull_request);
      setChanges(data.changes || []);
    } catch (err) {
      toast.error('Failed to push changes');
    } finally {
      setIsMerging(false);
    }
  };

  const statusColors = {
    open: 'bg-green-900 text-green-300',
    merged: 'bg-purple-900 text-purple-300',
    draft: 'bg-blue-900 text-blue-300',
    rejected: 'bg-red-900 text-red-300'
  };

  if (isLoading) return <LoadingSpinner />;

  if (error || !pr) return (
    <div className="text-center py-12 text-red-400">
      <XCircle size={48} className="mx-auto mb-4" />
      <p>{error || 'Request not found'}</p>
      <button onClick={() => navigate(-1)} className="mt-4 text-blue-400 hover:underline">Go Back</button>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 border-b border-gray-700 pb-6">
        <div>
          <button 
            onClick={() => navigate(`/sites/${siteSlug}/pages/${pageSlug}/requests`)}
            className="flex items-center gap-2 text-gray-500 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Requests
          </button>
          
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <span className="text-emerald-400">#{String(pr.number || pr.id).slice(0, 8)}</span>
            {pr.title || 'Untitled Update'}
          </h1>
          
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
            <span className={`px-2 py-0.5 rounded text-xs uppercase font-bold tracking-wider ${statusColors[pr.status] || 'bg-gray-800'}`}>
              {pr.status}
            </span>
            <span>Requested by <strong className="text-white">{pr.author?.name || 'Unknown'}</strong></span>
            <span>on {pr.created_at ? new Date(pr.created_at).toLocaleString(undefined, {
              dateStyle: 'medium',
              timeStyle: 'short'
            }) : 'Unknown Date'}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          {pr.status === 'draft' ? (
            <button
              onClick={handlePush}
              disabled={isMerging}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold flex items-center gap-2 shadow-lg transition-transform active:scale-95 disabled:opacity-50"
            >
              {isMerging ? <LoadingSpinner size="sm" /> : <GitPullRequest size={20} />}
              Push to Review
            </button>
          ) : pr.status === 'open' && (
            <div className="flex flex-col items-end gap-1">
              <button
                onClick={handleMergeClick}
                disabled={isMerging || !currentSite?.can_merge}
                className={`
                  px-6 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg transition-transform active:scale-95 
                  disabled:opacity-40 disabled:cursor-not-allowed
                  ${currentSite?.can_merge 
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                    : 'bg-gray-700 text-gray-400'}
                `}
              >
                {isMerging ? <LoadingSpinner size="sm" /> : <GitMerge size={20} />}
                Merge Request
              </button>
              {!currentSite?.can_merge && (
                <span className="text-[10px] text-red-400 flex items-center gap-1">
                  <AlertCircle size={10} />
                  Owner/Admin approval required to merge
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* View Toggle */}
      <div className="flex gap-1 bg-[#161b22] p-1 rounded-lg w-fit mb-4 border border-gray-700">
        {[
          { id: 'preview', label: 'Preview' },
          { id: 'diff', label: 'Diff' },
          { id: 'commits', label: 'Commits' },
          { id: 'pick', label: 'Resolve & Pick', icon: Layers, color: 'text-emerald-400' },
          conflictData && { id: 'conflict', label: 'Resolve Conflict', icon: AlertCircle, color: 'text-red-400' }
        ].filter(Boolean).map(tab => (
          <button
            key={tab.id}
            onClick={() => setViewMode(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
              viewMode === tab.id 
                ? 'bg-blue-600 text-white shadow-sm' 
                : `${tab.color || 'text-gray-400'} hover:text-white hover:bg-white/5`
            }`}
          >
            {tab.icon && <tab.icon size={14} />}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="bg-[#0d1117] rounded-xl border border-gray-700 overflow-hidden shadow-2xl min-h-[600px] flex">
        {/* Left Sidebar for Files */}
        {viewMode !== 'commits' && changes.length > 0 && viewMode !== 'conflict' && (
           <div className="w-64 border-r border-gray-700 bg-[#161b22] shrink-0">
             <div className="px-4 py-3 border-b border-gray-700">
               <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Changed Pages</span>
             </div>
             <div className="flex flex-col py-2">
               {changes.map(change => {
                 return (
                   <button
                     key={change.logical_id}
                     onClick={() => setSelectedLogicalId(change.logical_id)}
                     className={`flex items-start gap-3 px-4 py-2.5 text-left transition-colors ${selectedLogicalId === change.logical_id ? 'bg-blue-900/20 border-l-2 border-blue-500' : 'hover:bg-white/5 border-l-2 border-transparent'}`}
                   >
                     <div className="mt-0.5">
                       {change.type === 'added' ? <Plus size={14} className="text-green-400" /> :
                        change.type === 'deleted' ? <Trash2 size={14} className="text-red-400" /> :
                        <Edit2 size={14} className="text-yellow-400" />}
                     </div>
                     <span className={`text-sm truncate select-none ${selectedLogicalId === change.logical_id ? 'text-white font-medium' : 'text-gray-300'}`}>
                       {change.source_title || change.target_title || 'Untitled'}
                     </span>
                   </button>
                 );
               })}
             </div>
           </div>
        )}

        <div className="flex-1 flex flex-col min-w-0">
        {viewMode === 'conflict' && conflictData ? (
          <ConflictResolver 
              liveContent={conflictData.live_content}
             incomingContent={pr?.content} // TODO: Update ConflictResolver if needed for multi-page
             currentUserName={conflictData.current_user_name}
             contributorName={conflictData.contributor_name}
             onResolve={handleResolveConflict}
          />
        ) : viewMode === 'pick' ? (
          <BlockReviewer 
            oldContent={selectedChange ? { content: selectedChange.target_content, title: selectedChange.target_title } : null} 
            newContent={selectedChange ? { content: selectedChange.source_content, title: selectedChange.source_title } : null} 
            onMerge={(finalContent) => handleMergeClick(finalContent)}
          />
        ) : viewMode === 'commits' ? (
          <CommitHistory requestId={requestId} />
        ) : (
          <>
            <div className="bg-[#161b22] px-6 py-3 border-b border-gray-700 flex justify-between items-center shrink-0">
              <h2 className="font-semibold text-gray-300 flex items-center gap-2">
                {viewMode === 'preview' ? <Check size={16} className="text-emerald-400" /> : <GitPullRequest size={16} className="text-blue-400" />}
                {viewMode === 'preview' ? 'Proposed Content' : 'Comparison with Live Version'}
                {selectedChange && <span className="text-xs ml-2 px-2 py-0.5 bg-black/20 rounded-md text-gray-400 border border-gray-700">{selectedChange.source_title || selectedChange.target_title}</span>}
              </h2>
              <span className="text-xs text-gray-500">Read-only view</span>
            </div>
            
            <div className="p-0 flex-1 overflow-y-auto">
               {viewMode === 'preview' ? (
                 selectedChange?.type === 'deleted' ? (
                    <div className="p-12 text-center text-red-400 opacity-60 flex flex-col items-center">
                        <Trash2 size={48} className="mb-4" />
                        <p>This page will be deleted.</p>
                    </div>
                 ) : (
                    <div className="p-8 max-w-4xl mx-auto">
                      <RichEditor 
                        content={selectedChange?.source_content} 
                        editable={false} 
                        onChange={() => {}} 
                      />
                    </div>
                 )
               ) : (
                 <DiffViewer 
                   oldContent={selectedChange?.target_content} 
                   newContent={selectedChange?.source_content} 
                 />
               )}
            </div>
          </>
        )}
        </div>
      </div>

      {/* Description / Comment */}
      {pr.description && (
        <div className="mt-8 bg-[#161b22] p-6 rounded-xl border border-gray-700">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Description</h3>
          <p className="text-gray-300 leading-relaxed font-mono text-sm bg-black/20 p-4 rounded-lg">
            {pr.description}
          </p>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showMergeConfirm}
        onClose={() => setShowMergeConfirm(false)}
        onConfirm={handleConfirmMerge}
        title="Merge Change Request"
        message="Are you sure you want to merge these changes? This will overwrite the live content of the page."
        confirmText="Merge Changes"
        variant="primary"
        isLoading={isMerging}
      />
    </div>
  );
}
