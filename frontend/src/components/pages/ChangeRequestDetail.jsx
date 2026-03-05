import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  GitPullRequest, ArrowLeft, Check, GitMerge, XCircle, Layers,
  FileText, Plus, Edit2, Trash2, AlertCircle, GitBranch, CheckCircle2, ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { mergeChangeRequest } from '../../api/pages';
import BlockReviewer from '../editor/BlockReviewer';
import CommitHistory from './CommitHistory';
import RichEditor from '../editor/RichEditor';
import client from '../../api/client';
import LoadingSpinner from '../common/LoadingSpinner';
import ConfirmModal from '../common/ConfirmModal';
import ConflictResolver from './ConflictResolver';
import useSiteStore from '../../stores/siteStore';
import usePageStore from '../../stores/pageStore';

async function getChangeRequestDetail(requestId) {
  const response = await client.get(`/requests/${requestId}`);
  return response.data;
}

export default function ChangeRequestDetail() {
  const { siteSlug, pageSlug, requestId } = useParams();
  const navigate = useNavigate();
  const { currentSite, fetchSite, branches, switchBranch, fetchBranches } = useSiteStore();
  const [pr, setPr] = useState(null);
  const [changes, setChanges] = useState([]);
  const [selectedLogicalId, setSelectedLogicalId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMerging, setIsMerging] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('preview');
  const [showMergeConfirm, setShowMergeConfirm] = useState(false);
  const [pendingContent, setPendingContent] = useState(null);
  const [conflictData, setConflictData] = useState(null);

  // Fetch Site Data if missing (e.g. on refresh)
  useEffect(() => {
    if (siteSlug && (!currentSite || currentSite.slug !== siteSlug)) {
      fetchSite(siteSlug);
    }
    if (siteSlug) fetchBranches(siteSlug);
  }, [siteSlug, currentSite, fetchSite, fetchBranches]);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const data = await getChangeRequestDetail(requestId);
        setPr(data.pull_request);
        const fetchedChanges = data.changes || [];
        setChanges(fetchedChanges);
        if (fetchedChanges.length > 0) {
          setSelectedLogicalId(fetchedChanges[0].logical_id);
          
          // Proactively detect conflicts
          const hasConflicts = fetchedChanges.some(c => c.has_conflict);
          if (hasConflicts) {
            setConflictData({ conflicts: fetchedChanges.filter(c => c.has_conflict) });
            setViewMode('conflict');
          }
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
  const isMerged   = pr?.status === 'merged';
  const isRejected = pr?.status === 'rejected';
  const isClosed   = isMerged || isRejected;

  // Resolve target branch name from PR data
  const targetBranch = branches.find(b => b.id === pr?.target_branch_id);
  const sourceBranch = branches.find(b => b.id === pr?.source_branch_id);

  const pendingConflicts = changes.some(c => c.has_conflict) || !!conflictData;

  const handleMergeClick = (content = null) => {
    if (pendingConflicts) {
      setViewMode('conflict');
      return;
    }

    if (content && typeof content === 'object' && content.type === 'doc') {
      setPendingContent(content);
    } else {
      setPendingContent(null);
    }
    setShowMergeConfirm(true);
  };

  const handleConfirmMerge = async () => {
    setIsMerging(true);
    setShowMergeConfirm(false);

    try {
      // If user picked specific blocks via BlockReviewer, update source page first
      if (pendingContent && pendingContent.type === 'doc' && selectedChange?.page?.id) {
        await client.put(
          `/sites/${siteSlug}/pages/${selectedChange.page.id}`,
          { content: pendingContent },
          { params: { branch_id: selectedChange.page.branch_id } }
        );
      }

      const mergeResult = await mergeChangeRequest(requestId, {});
      toast.success('Changes merged successfully!');

      // ─── Post-merge: switch UI to the TARGET branch ──────────────────────
      // Find target branch — try from branches store, then fallback to PR's embedded data
      const resolvedTargetBranch = targetBranch
        || (pr?.target_branch_id
          ? { id: pr.target_branch_id, name: mergeResult?.data?.target_branch?.name || 'main' }
          : null);

      const targetBranchName = resolvedTargetBranch?.name
        || branches.find(b => b.is_default)?.name
        || 'main';

      // Switch active branch in store + persist to localStorage
      switchBranch(targetBranchName, siteSlug);

      // Clear stale currentPage so PageContent re-fetches from new branch
      usePageStore.getState().setCurrentPage(null);

      // Navigate to the first changed page on the target branch
      const mergedPageSlug = changes[0]?.page?.slug || pageSlug;
      navigate(`/sites/${siteSlug}/pages/${mergedPageSlug}`);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 422 && err.response?.data?.conflicts) {
        setConflictData(err.response.data);
        setViewMode('conflict');
        toast.error('Conflict detected! Please resolve before merging.');
      } else {
        toast.error('Failed to merge changes: ' + (err.response?.data?.message || err.message));
      }
      setIsMerging(false);
    }
  };

  const handleConflictsResolved = () => {
    getChangeRequestDetail(requestId).then(data => {
      setPr(data.pull_request);
      setChanges(data.changes || []);
      setConflictData(null);
      setViewMode('preview');
      toast.info('Conflicts resolved! You can now merge the request.');
    }).catch(() => {
      setConflictData(null);
      setViewMode('preview');
    });
  };

  const statusColors = {
    open:     'bg-green-900 text-green-300',
    merged:   'bg-purple-900 text-purple-300',
    draft:    'bg-blue-900 text-blue-300',
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
              dateStyle: 'medium', timeStyle: 'short'
            }) : 'Unknown Date'}</span>
          </div>

          {/* Branch flow indicator */}
          {(sourceBranch || targetBranch) && (
            <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
              <GitBranch size={12} />
              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                {sourceBranch?.name || 'source'}
              </span>
              <ArrowRight size={12} />
              <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                {targetBranch?.name || 'target'}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          {pr.status === 'open' && (
            <div className="flex flex-col items-end gap-1">
              <button
                onClick={handleMergeClick}
                disabled={isMerging || !currentSite?.can_merge}
                className={`
                  px-6 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg transition-transform active:scale-95
                  disabled:opacity-40 disabled:cursor-not-allowed
                  ${!currentSite?.can_merge
                    ? 'bg-gray-700 text-gray-400'
                    : pendingConflicts
                      ? 'bg-orange-600 hover:bg-orange-500 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }
                `}
              >
                {isMerging ? (
                  <LoadingSpinner size="sm" />
                ) : pendingConflicts ? (
                  <AlertCircle size={20} />
                ) : (
                  <GitMerge size={20} />
                )}
                {pendingConflicts ? 'Resolve Conflicts' : 'Merge Request'}
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

      {/* ── Merged Banner ────────────────────────────────────────────────────── */}
      {isMerged && (
        <div className="mb-6 p-5 rounded-xl border border-purple-500/30 bg-purple-500/5 flex items-start gap-4">
          <CheckCircle2 size={24} className="text-purple-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-bold text-purple-300 text-base mb-1">
              Pull request merged
            </h3>
            <p className="text-sm text-gray-400">
              Changes from{' '}
              <span className="font-mono text-amber-400">{sourceBranch?.name || 'source'}</span>
              {' '}have been merged into{' '}
              <span className="font-mono text-blue-400">{targetBranch?.name || 'target'}</span>.
              {pr.merged_by_user && (
                <span> Merged by <strong className="text-white">{pr.merged_by_user.name}</strong>
                {pr.merged_at && ` on ${new Date(pr.merged_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}`}.
                </span>
              )}
            </p>
          </div>
          {targetBranch && (
            <button
              onClick={() => {
                switchBranch(targetBranch.name, siteSlug);
                usePageStore.getState().setCurrentPage(null);
                navigate(`/sites/${siteSlug}/pages/${pageSlug}`);
              }}
              className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition-colors"
            >
              <GitBranch size={14} />
              Switch to {targetBranch.name}
            </button>
          )}
        </div>
      )}

      {/* ── Rejected Banner ──────────────────────────────────────────────────── */}
      {isRejected && (
        <div className="mb-6 p-5 rounded-xl border border-red-500/30 bg-red-500/5 flex items-start gap-4">
          <XCircle size={24} className="text-red-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-red-300 text-base mb-1">Pull request rejected</h3>
            <p className="text-sm text-gray-400">This pull request was closed without merging.</p>
          </div>
        </div>
      )}

      {/* View Toggle — hide interactive tabs when PR is closed */}
      <div className="flex gap-1 bg-[#161b22] p-1 rounded-lg w-fit mb-4 border border-gray-700">
        {[
          { id: 'preview',  label: 'Preview' },
          { id: 'commits',  label: 'Commits' },
          // Only show Resolve & Pick when PR is open
          !isClosed && { id: 'pick', label: 'Resolve & Pick', icon: Layers, color: 'text-emerald-400' },
          // Only show Conflict tab when there's conflict data
          conflictData && !isClosed && { id: 'conflict', label: 'Resolve Conflict', icon: AlertCircle, color: 'text-red-400' }
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
              {changes.map(change => (
                <button
                  key={change.logical_id}
                  onClick={() => setSelectedLogicalId(change.logical_id)}
                  className={`flex items-start gap-3 px-4 py-2.5 text-left transition-colors ${
                    selectedLogicalId === change.logical_id
                      ? 'bg-blue-900/20 border-l-2 border-blue-500'
                      : 'hover:bg-white/5 border-l-2 border-transparent'
                  }`}
                >
                  <div className="mt-0.5">
                    {change.type === 'added'   ? <Plus  size={14} className="text-green-400" /> :
                     change.type === 'deleted' ? <Trash2 size={14} className="text-red-400" /> :
                     <Edit2 size={14} className="text-yellow-400" />}
                  </div>
                  <span className={`text-sm truncate select-none ${
                    selectedLogicalId === change.logical_id ? 'text-white font-medium' : 'text-gray-300'
                  }`}>
                    {change.source_title || change.target_title || 'Untitled'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col min-w-0">
          {viewMode === 'conflict' && conflictData?.conflicts && !isClosed ? (
            <ConflictResolver
              siteSlug={siteSlug}
              prId={requestId}
              conflicts={conflictData.conflicts}
              onResolved={handleConflictsResolved}
            />
          ) : viewMode === 'pick' && !isClosed ? (
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
                  <Check size={16} className="text-emerald-400" />
                  Proposed Content
                  {selectedChange && (
                    <span className="text-xs ml-2 px-2 py-0.5 bg-black/20 rounded-md text-gray-400 border border-gray-700">
                      {selectedChange.source_title || selectedChange.target_title}
                    </span>
                  )}
                </h2>
                <span className="text-xs text-gray-500">Read-only view</span>
              </div>

              <div className="p-0 flex-1 overflow-y-auto">
                {selectedChange?.type === 'deleted' ? (
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
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Description */}
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
        message={`Are you sure you want to merge changes from '${sourceBranch?.name || 'source'}' into '${targetBranch?.name || 'target'}'? After merging you will be taken to the ${targetBranch?.name || 'target'} branch.`}
        confirmText="Merge Changes"
        variant="primary"
        isLoading={isMerging}
      />
    </div>
  );
}
