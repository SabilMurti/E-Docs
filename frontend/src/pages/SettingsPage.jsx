import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Settings, Users, Globe, Lock, Trash2, ArrowLeft,
  Copy, Check, ExternalLink, AlertTriangle, Save, X
} from 'lucide-react';
import useSpaceStore from '../stores/spaceStore';
import useAuthStore from '../stores/authStore';
import MemberList from '../components/members/MemberList';
import SpaceForm from '../components/spaces/SpaceForm';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ConfirmModal from '../components/common/ConfirmModal';

function SettingsPage() {
  const { spaceId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentSpace, fetchSpace, updateSpace, deleteSpace, publishSpace, unpublishSpace, isLoading } = useSpaceStore();

  const [activeTab, setActiveTab] = useState('general');
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (spaceId) fetchSpace(spaceId);
  }, [spaceId, fetchSpace]);

  const handleUpdate = async (data) => {
    const result = await updateSpace(spaceId, data);
    if (result.success) setShowEditForm(false);
    return result;
  };

  const handlePublishToggle = async () => {
    setIsPublishing(true);
    if (currentSpace?.is_published) {
      await unpublishSpace(spaceId);
    } else {
      await publishSpace(spaceId);
    }
    await fetchSpace(spaceId);
    setIsPublishing(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteSpace(spaceId);
    if (result.success) navigate('/');
    setIsDeleting(false);
  };

  const publicUrl = `${window.location.origin}/public/${currentSpace?.id}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading && !currentSpace) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'members', label: 'Members', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">
      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* ── Header ── */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(`/spaces/${spaceId}`)}
            className="p-2 rounded-lg hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Workspace Settings</h1>
            <p className="text-sm text-[var(--color-text-muted)]">{currentSpace?.name}</p>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 mb-6 bg-[var(--color-bg-secondary)] p-1 rounded-xl border border-[var(--color-border-primary)] w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${activeTab === tab.id
                  ? 'bg-[var(--color-accent)] text-white shadow-lg shadow-[var(--color-accent)]/20'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'}
              `}
            >
              <tab.icon size={15} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── General Tab ── */}
        {activeTab === 'general' && (
          <div className="space-y-6">

            {/* Space Info */}
            <section className="bg-[var(--color-bg-secondary)] rounded-2xl border border-[var(--color-border-primary)] p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-semibold text-[var(--color-text-primary)]">{currentSpace?.name}</h2>
                  <p className="text-sm text-[var(--color-text-muted)] mt-1">
                    {currentSpace?.description || 'No description'}
                  </p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => setShowEditForm(true)} icon={Save}>
                  Edit
                </Button>
              </div>
            </section>

            {/* Publishing */}
            <section className="bg-[var(--color-bg-secondary)] rounded-2xl border border-[var(--color-border-primary)] p-6">
              <h2 className="text-base font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                <Globe size={18} className="text-[var(--color-accent)]" />
                Published Documentation
              </h2>

              <div className="flex items-center justify-between p-4 bg-[var(--color-bg-tertiary)] rounded-xl border border-[var(--color-border-primary)]">
                <div className="flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                    currentSpace?.is_published
                      ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                      : 'bg-[var(--color-bg-hover)] text-[var(--color-text-muted)]'
                  }`}>
                    {currentSpace?.is_published ? <Globe size={20} /> : <Lock size={20} />}
                  </div>
                  <div>
                    <p className="font-medium text-[var(--color-text-primary)] text-sm">
                      {currentSpace?.is_published ? 'Published' : 'Private'}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                      {currentSpace?.is_published
                        ? 'Your documentation is live and accessible to everyone'
                        : 'Only workspace members can access this content'}
                    </p>
                  </div>
                </div>
                <Button
                  variant={currentSpace?.is_published ? 'secondary' : 'primary'}
                  size="sm"
                  onClick={handlePublishToggle}
                  isLoading={isPublishing}
                >
                  {currentSpace?.is_published ? 'Unpublish' : 'Publish'}
                </Button>
              </div>

              {currentSpace?.is_published && (
                <div className="mt-4 p-4 bg-[var(--color-accent)]/5 border border-[var(--color-accent)]/20 rounded-xl">
                  <p className="text-xs font-semibold text-[var(--color-accent)] uppercase tracking-wider mb-2">
                    Public URL
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] text-[var(--color-text-secondary)] px-3 py-2 rounded-lg text-xs font-mono truncate">
                      {publicUrl}
                    </code>
                    <button
                      onClick={copyUrl}
                      className="p-2 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] hover:border-[var(--color-accent)]/40 text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors"
                      title="Copy URL"
                    >
                      {copied ? <Check size={16} className="text-[var(--color-accent)]" /> : <Copy size={16} />}
                    </button>
                    <a
                      href={publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] hover:border-[var(--color-accent)]/40 text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors"
                      title="Open in new tab"
                    >
                      <ExternalLink size={16} />
                    </a>
                  </div>
                </div>
              )}
            </section>

            {/* Danger Zone */}
            <section className="bg-[var(--color-bg-secondary)] rounded-2xl border border-red-500/30 p-6">
              <h2 className="text-base font-semibold text-red-500 mb-1 flex items-center gap-2">
                <AlertTriangle size={18} />
                Danger Zone
              </h2>
              <p className="text-xs text-[var(--color-text-muted)] mb-4">
                Irreversible and destructive actions.
              </p>

              <div className="flex items-center justify-between p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
                <div>
                  <p className="font-medium text-[var(--color-text-primary)] text-sm">Delete this workspace</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    Once deleted, this workspace and all its pages will be permanently removed.
                  </p>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setShowDeleteModal(true)}
                  isLoading={isDeleting}
                  icon={Trash2}
                >
                  Delete
                </Button>
              </div>
            </section>
          </div>
        )}

        {/* ── Members Tab ── */}
        {activeTab === 'members' && (
          <MemberList spaceId={spaceId} currentUserId={user?.id} />
        )}

        {/* Edit Form Modal */}
        <SpaceForm
          isOpen={showEditForm}
          onClose={() => setShowEditForm(false)}
          onSubmit={handleUpdate}
          initialData={currentSpace}
        />

        {/* Delete Confirm Modal */}
        <ConfirmModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
          title="Delete Workspace"
          message={`Are you sure you want to delete "${currentSpace?.name}"? This workspace and all its pages will be permanently removed. This action cannot be undone.`}
          confirmText="Delete Workspace"
          variant="danger"
          isLoading={isDeleting}
        />
      </div>
    </div>
  );
}

export default SettingsPage;
