import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GitPullRequest, Clock, User, ArrowLeft, Check, X } from 'lucide-react';
import { getChangeRequests } from '../../api/pages';
import LoadingSpinner from '../common/LoadingSpinner';

export default function ChangeRequestsList() {
  const { siteId, pageId } = useParams();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const data = await getChangeRequests(pageId);
        setRequests(data);
      } catch (error) {
        console.error('Failed to fetch requests:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (pageId) fetchRequests();
  }, [pageId]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <button 
        onClick={() => navigate(`/sites/${siteId}/pages/${pageId}`)}
        className="flex items-center gap-2 text-gray-500 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Page
      </button>

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <GitPullRequest className="text-emerald-400" />
          Change Requests
        </h1>
        <span className="bg-gray-800 text-gray-300 px-3 py-1 rounded-full text-sm">
          {requests.length} Open
        </span>
      </div>

      <div className="space-y-4">
        {requests.length === 0 ? (
          <div className="text-center py-12 bg-[#161b22] rounded-xl border border-white/5">
            <GitPullRequest size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400">No open change requests for this page.</p>
          </div>
        ) : (
          requests.map(request => (
            <div 
              key={request.id}
              onClick={() => navigate(`/sites/${siteId}/pages/${pageId}/requests/${request.id}`)}
              className="bg-[#161b22] border border-white/10 rounded-xl p-5 hover:border-emerald-500/50 transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-emerald-400 group-hover:underline">
                  {request.title || 'Untitled Update'}
                </h3>
                <span className={`px-2 py-1 rounded text-xs uppercase font-medium ${
                  request.status === 'open' ? 'bg-green-500/20 text-green-400' : 
                  request.status === 'draft' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-gray-700 text-gray-300'
                }`}>
                  {request.status}
                </span>
              </div>
              
              <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                {request.description || 'No description provided.'}
              </p>
              
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1.5">
                  <User size={14} />
                  <span>{request.user?.name || 'Unknown User'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={14} />
                  <span>{new Date(request.created_at).toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  })}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
