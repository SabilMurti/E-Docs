import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GitPullRequest, ArrowLeft, Check, Merge, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getChangeRequests, mergeChangeRequest } from '../../api/pages';
import { getPage } from '../../api/pages';
import DiffViewer from '../editor/DiffViewer';
import RichEditor from '../editor/RichEditor';
import client from '../../api/client';
import LoadingSpinner from '../common/LoadingSpinner';
import ConfirmModal from '../common/ConfirmModal';

async function getChangeRequestDetail(requestId) {
  const response = await client.get(`/requests/${requestId}`);
  return response.data;
}

export default function ChangeRequestDetail() {
  const { siteId, pageId, requestId } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [currentPage, setCurrentPage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMerging, setIsMerging] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('preview'); // 'preview' | 'diff'
  const [showMergeConfirm, setShowMergeConfirm] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const data = await getChangeRequestDetail(requestId);
        setRequest(data);
        
        // Fetch current page content for diff comparison
        if (siteId && pageId) {
            const pageRes = await getPage(siteId, pageId);
            // Handle Laravel API Resource wrapper or direct object
            const pageData = pageRes.data || pageRes;
            setCurrentPage(pageData);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load request details');
      } finally {
        setIsLoading(false);
      }
    };
    if (requestId) fetchDetail();
  }, [requestId, siteId, pageId]);

  const handleMergeClick = () => {
    setShowMergeConfirm(true);
  };

  const handleConfirmMerge = async () => {
    setIsMerging(true);
    setShowMergeConfirm(false); // Close modal explicitly or wait
    
    try {
      await mergeChangeRequest(requestId);
      toast.success('Changes merged successfully!');
      // Navigate back to page view
      navigate(`/sites/${siteId}/pages/${pageId}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to merge changes: ' + err.message);
      setIsMerging(false);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  if (error || !request) return (
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
            onClick={() => navigate(`/sites/${siteId}/pages/${pageId}/requests`)}
            className="flex items-center gap-2 text-gray-500 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Requests
          </button>
          
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <span className="text-emerald-400">#{request.id.slice(0, 8)}</span>
            {request.title || 'Untitled Update'}
          </h1>
          
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
            <span className={`px-2 py-0.5 rounded text-xs uppercase font-bold tracking-wider ${
              request.status === 'open' ? 'bg-green-900 text-green-300' : 
              request.status === 'merged' ? 'bg-purple-900 text-purple-300' : 'bg-gray-800'
            }`}>
              {request.status}
            </span>
            <span>Requested by <strong className="text-white">{request.user?.name || 'Unknown'}</strong></span>
            <span>on {new Date(request.created_at).toLocaleString()}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          {request.status === 'open' && (
            <button
              onClick={handleMergeClick}
              disabled={isMerging}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center gap-2 shadow-lg transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isMerging ? <LoadingSpinner size="sm" /> : <Merge size={20} />}
              Merge Request
            </button>
          )}
        </div>
      </div>
      
      {/* View Toggle */}
      <div className="flex gap-1 bg-[#161b22] p-1 rounded-lg w-fit mb-4 border border-gray-700">
        <button
          onClick={() => setViewMode('preview')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            viewMode === 'preview' 
              ? 'bg-blue-600 text-white shadow-sm' 
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Preview (Rendered)
        </button>
        <button
          onClick={() => setViewMode('diff')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            viewMode === 'diff' 
              ? 'bg-blue-600 text-white shadow-sm' 
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Diff (Source Changes)
        </button>
      </div>

      {/* Content Area */}
      <div className="bg-[#0d1117] rounded-xl border border-gray-700 overflow-hidden shadow-2xl">
        <div className="bg-[#161b22] px-6 py-3 border-b border-gray-700 flex justify-between items-center">
          <h2 className="font-semibold text-gray-300 flex items-center gap-2">
            {viewMode === 'preview' ? <Check size={16} className="text-emerald-400" /> : <GitPullRequest size={16} className="text-blue-400" />}
            {viewMode === 'preview' ? 'Proposed Content' : 'Comparison with Live Version'}
          </h2>
          <span className="text-xs text-gray-500">Read-only view</span>
        </div>
        
        <div className="p-0 min-h-[500px]">
           {viewMode === 'preview' ? (
             <div className="p-8">
               <RichEditor 
                 content={request.content} 
                 editable={false} 
                 onChange={() => {}} 
               />
             </div>
           ) : (
             <DiffViewer 
               oldContent={currentPage?.content} 
               newContent={request.content} 
             />
           )}
        </div>
      </div>

      {/* Description / Comment */}
      {request.description && (
        <div className="mt-8 bg-[#161b22] p-6 rounded-xl border border-gray-700">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Description</h3>
          <p className="text-gray-300 leading-relaxed font-mono text-sm bg-black/20 p-4 rounded-lg">
            {request.description}
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
        variant="success" // Custom variant if supported, otherwise normal
        isLoading={isMerging}
      />
    </div>
  );
}
