import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Globe, Lock, Trash2, ArrowLeft, Copy, Check,
  ExternalLink, Sparkles, AlertTriangle, Save, X, RefreshCw
} from 'lucide-react';
import useSiteStore from '../stores/siteStore';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import SiteMembers from '../components/sites/SiteMembers';
import ConfirmModal from '../components/common/ConfirmModal';
import { toast } from 'sonner';
import client from '../api/client';

function SiteSettingsPage() {
  const { siteSlug } = useParams();
  const navigate = useNavigate();
  const { currentSite, fetchSite, updateSite, deleteSite, publishSite, unpublishSite, isLoading } = useSiteStore();

  const [isPublishing, setIsPublishing] = useState(false);
  const [isRepublishing, setIsRepublishing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => {
    if (siteSlug) fetchSite(siteSlug);
  }, [siteSlug, fetchSite]);

  useEffect(() => {
    if (currentSite) {
      setFormData({
        name: currentSite.name || '',
        description: currentSite.description || '',
      });
    }
  }, [currentSite]);

  const handlePublishToggle = async () => {
    setIsPublishing(true);
    if (currentSite?.is_published) {
      await unpublishSite(siteSlug);
    } else {
      await publishSite(siteSlug);
    }
    await fetchSite(siteSlug);
    setIsPublishing(false);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    await updateSite(siteSlug, formData);
    setEditMode(false);
  };

  const handleRepublish = async () => {
    if (!currentSite?.is_published) return;
    
    setIsRepublishing(true);
    try {
      const response = await client.post(`/sites/${siteSlug}/republish`, {
        old_slug: currentSite.slug
      });
      
      if (response.data) {
        toast.success('Site republished! URL updated.');
        await fetchSite(siteSlug);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to republish site');
    } finally {
      setIsRepublishing(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteSite(siteSlug);
    if (result.success) navigate('/');
    setIsDeleting(false);
  };

  const publicUrl = currentSite?.is_published
    ? `${window.location.origin}/public/${currentSite.slug}`
    : '';

  const copyUrl = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading && !currentSite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">
      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* ── Header ── */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(`/sites/${siteSlug}`)}
            className="p-2 rounded-lg hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-accent)] flex items-center justify-center shadow-lg shadow-[var(--color-accent)]/20">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Site Settings</h1>
              <p className="text-sm text-[var(--color-text-muted)]">{currentSite?.name}</p>
            </div>
          </div>
        </div>

        {/* ── Sections ── */}
        <div className="space-y-6">

          {/* ── General ── */}
          <section className="bg-[var(--color-bg-secondary)] rounded-2xl border border-[var(--color-border-primary)] p-6">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">General</h2>
              {!editMode && (
                <Button variant="secondary" size="sm" onClick={() => setEditMode(true)}>
                  Edit
                </Button>
              )}
            </div>

            {editMode ? (
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                    Site Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded-xl text-[var(--color-text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)]/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    placeholder="Describe what this site is about..."
                    className="w-full px-4 py-2.5 bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded-xl text-[var(--color-text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)]/50 transition-all resize-none"
                  />
                </div>
                <div className="flex gap-3 pt-1">
                  <Button type="button" variant="secondary" size="sm" onClick={() => setEditMode(false)} icon={X}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" icon={Save}>
                    Save Changes
                  </Button>
                </div>
              </form>
            ) : (
              <div>
                <h3 className="font-semibold text-[var(--color-text-primary)]">{currentSite?.name}</h3>
                <p className="text-sm text-[var(--color-text-muted)] mt-1">
                  {currentSite?.description || 'No description'}
                </p>
              </div>
            )}
          </section>

          {/* ── Published Documentation ── */}
          <section className="bg-[var(--color-bg-secondary)] rounded-2xl border border-[var(--color-border-primary)] p-6">
            <h2 className="text-base font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
              <Globe size={18} className="text-[var(--color-accent)]" />
              Published Documentation
            </h2>

            <div className="flex items-center justify-between p-4 bg-[var(--color-bg-tertiary)] rounded-xl border border-[var(--color-border-primary)]">
              <div className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                  currentSite?.is_published
                    ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                    : 'bg-[var(--color-bg-hover)] text-[var(--color-text-muted)]'
                }`}>
                  {currentSite?.is_published ? <Globe size={20} /> : <Lock size={20} />}
                </div>
                <div>
                  <p className="font-medium text-[var(--color-text-primary)] text-sm">
                    {currentSite?.is_published ? 'Published' : 'Private'}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    {currentSite?.is_published
                      ? 'Your documentation is live and accessible to everyone'
                      : 'Only you can access this documentation'}
                  </p>
                </div>
              </div>
              <Button
                variant={currentSite?.is_published ? 'secondary' : 'primary'}
                size="sm"
                onClick={handlePublishToggle}
                isLoading={isPublishing}
              >
                {currentSite?.is_published ? 'Unpublish' : 'Publish'}
              </Button>
            </div>

            {currentSite?.is_published && (
              <div className="mt-4 space-y-4">
                <div className="p-4 bg-[var(--color-accent)]/5 border border-[var(--color-accent)]/20 rounded-xl">
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
                  <p className="text-xs text-[var(--color-text-muted)] mt-2">
                    💡 The URL automatically updates when you change the site name.
                  </p>
                </div>

                <div className="p-4 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">Regenerate URL</p>
                      <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                        Create a new unique URL based on the current site name.
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleRepublish}
                      isLoading={isRepublishing}
                      icon={RefreshCw}
                    >
                      Republish
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* ── Collaborators ── */}
          <SiteMembers siteSlug={siteSlug} />

          {/* ── Danger Zone ── */}
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
                <p className="font-medium text-[var(--color-text-primary)] text-sm">Delete this site</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  Once deleted, this site and all its pages will be permanently removed.
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
      </div>

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Site"
        message={`Are you sure you want to delete "${currentSite?.name}"? This site and all its pages will be permanently removed. This action cannot be undone.`}
        confirmText="Delete Site"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}

export default SiteSettingsPage;
