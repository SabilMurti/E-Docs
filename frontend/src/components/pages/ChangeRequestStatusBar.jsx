import { useState } from 'react';
import { GitPullRequest, Check, X, Eye, MessageSquare, Clock } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import Dropdown from '../common/Dropdown';

/**
 * GitHub-Style Change Request Status Bar
 * Shows at the top of the editor when there are pending changes
 */
export default function ChangeRequestStatusBar({ 
  currentRequest, 
  hasUncommittedChanges,
  onCommit,
  onPublish,
  onDiscard 
}) {
  const navigate = useNavigate();
  const { siteId, pageId } = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!currentRequest && !hasUncommittedChanges) {
    return null; // No changes to show
  }

  const isDraft = currentRequest?.status === 'draft';
  const isOpen = currentRequest?.status === 'open';
  const isApproved = currentRequest?.status === 'approved';
  const isRejected = currentRequest?.status === 'rejected';

  const handleCommit = async () => {
    setIsSubmitting(true);
    try {
      await onCommit?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublish = async () => {
    setIsSubmitting(true);
    try {
      await onPublish?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="border-b border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)]">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Status Info */}
          <div className="flex items-center gap-3">
            {/* Icon Badge */}
            <div className={`
              p-2 rounded-lg flex items-center justify-center
              ${isDraft ? 'bg-gray-500/10 text-gray-500' : ''}
              ${isOpen ? 'bg-yellow-500/10 text-yellow-500' : ''}
              ${isApproved ? 'bg-green-500/10 text-green-500' : ''}
              ${isRejected ? 'bg-red-500/10 text-red-500' : ''}
              ${!currentRequest ? 'bg-blue-500/10 text-blue-500' : ''}
            `}>
              {isApproved ? <Check size={16} /> : 
               isRejected ? <X size={16} /> :
               <GitPullRequest size={16} />}
            </div>

            {/* Status Text */}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-[var(--color-text-primary)]">
                  {!currentRequest ? 'Unsaved Changes' :
                   isDraft ? 'Draft Changes' :
                   isOpen ? 'Pending Review' :
                   isApproved ? 'Approved ✓' :
                   isRejected ? 'Changes Requested' :
                   'Change Request'}
                </h3>
                
                {currentRequest && (
                  <span className={`
                    px-2 py-0.5 rounded-full text-xs font-medium
                    ${isDraft ? 'bg-gray-500/20 text-gray-400' : ''}
                    ${isOpen ? 'bg-yellow-500/20 text-yellow-400' : ''}
                    ${isApproved ? 'bg-green-500/20 text-green-400' : ''}
                    ${isRejected ? 'bg-red-500/20 text-red-400' : ''}
                  `}>
                    {currentRequest.status.toUpperCase()}
                  </span>
                )}
              </div>
              
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                {!currentRequest ? 
                  'Save your changes to create a change request' :
                  currentRequest.title || 'Untitled Change Request'}
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* View All Requests */}
            <button
              onClick={() => navigate(`/sites/${siteId}/pages/${pageId}/requests`)}
              className="px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] rounded-md transition-colors flex items-center gap-1.5"
            >
              <Eye size={14} />
              View all
            </button>

            {/* Primary Action */}
            {!currentRequest && hasUncommittedChanges ? (
              <button
                onClick={handleCommit}
                disabled={isSubmitting}
                className="px-3 py-1.5 text-xs font-medium bg-[var(--color-accent)] hover:bg-[var(--color-accent)]/90 text-white rounded-md transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                <Check size={14} />
                {isSubmitting ? 'Saving...' : 'Commit Changes'}
              </button>
            ) : isDraft ? (
              <button
                onClick={handlePublish}
                disabled={isSubmitting}
                className="px-3 py-1.5 text-xs font-medium bg-[var(--color-accent)] hover:bg-[var(--color-accent)]/90 text-white rounded-md transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                <GitPullRequest size={14} />
                {isSubmitting ? 'Publishing...' : 'Publish for Review'}
              </button>
            ) : isOpen ? (
              <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                <Clock size={12} />
                <span>Awaiting review</span>
              </div>
            ) : isApproved ? (
              <div className="flex items-center gap-2 text-xs text-green-400">
                <Check size={12} />
                <span>Ready to merge</span>
              </div>
            ) : null}

            {/* More Options */}
            {currentRequest && (
              <Dropdown
                trigger={
                  <button className="p-1.5 hover:bg-[var(--color-bg-hover)] rounded-md text-[var(--color-text-muted)] transition-colors">
                    <MessageSquare size={14} />
                  </button>
                }
                align="right"
              >
                <Dropdown.Item 
                  onClick={() => navigate(`/sites/${siteId}/pages/${pageId}/requests/${currentRequest.id}`)}
                  icon={Eye}
                >
                  View Details
                </Dropdown.Item>
                {isDraft && (
                  <>
                    <Dropdown.Divider />
                    <Dropdown.Item 
                      onClick={onDiscard}
                      icon={X}
                      danger
                    >
                      Discard Draft
                    </Dropdown.Item>
                  </>
                )}
              </Dropdown>
            )}
          </div>
        </div>

        {/* Description Preview (if exists) */}
        {currentRequest?.description && (
          <div className="mt-2 text-xs text-[var(--color-text-secondary)] pl-11 line-clamp-1">
            {currentRequest.description}
          </div>
        )}
      </div>
    </div>
  );
}
