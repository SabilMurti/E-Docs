import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Settings, Globe, Lock, Trash2, ArrowLeft, Copy, Check, ExternalLink, Sparkles } from 'lucide-react';
import useSiteStore from '../stores/siteStore';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';

function SiteSettingsPage() {
  const { siteId } = useParams();
  const navigate = useNavigate();
  const { currentSite, fetchSite, updateSite, deleteSite, publishSite, unpublishSite, isLoading } = useSiteStore();
  
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => {
    if (siteId) {
      fetchSite(siteId);
    }
  }, [siteId, fetchSite]);

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
      await unpublishSite(siteId);
    } else {
      await publishSite(siteId);
    }
    await fetchSite(siteId);
    setIsPublishing(false);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    await updateSite(siteId, formData);
    setEditMode(false);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this site? This action cannot be undone.')) {
      return;
    }
    
    setIsDeleting(true);
    const result = await deleteSite(siteId);
    if (result.success) {
      navigate('/');
    }
    setIsDeleting(false);
  };

  const publicUrl = `${window.location.origin}/public/${currentSite?.id}`;
  
  const copyUrl = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading && !currentSite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#141414]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414]">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate(`/sites/${siteId}`)}
            className="p-2 rounded-lg hover:bg-white/10 text-gray-400 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Site Settings
              </h1>
              <p className="text-gray-400">
                {currentSite?.name}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Site Info */}
          <div className="bg-[#1c1c1c] rounded-2xl border border-white/10 p-6">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">General</h2>
              {!editMode && (
                <Button variant="secondary" size="sm" onClick={() => setEditMode(true)}>
                  Edit
                </Button>
              )}
            </div>

            {editMode ? (
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Site Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-[#252525] border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-[#252525] border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50 resize-none"
                  />
                </div>
                <div className="flex gap-3">
                  <Button type="button" variant="secondary" onClick={() => setEditMode(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Save Changes
                  </Button>
                </div>
              </form>
            ) : (
              <div>
                <h3 className="font-medium text-white">{currentSite?.name}</h3>
                <p className="text-gray-500 mt-1">
                  {currentSite?.description || 'No description'}
                </p>
              </div>
            )}
          </div>

          {/* Publishing */}
          <div className="bg-[#1c1c1c] rounded-2xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Globe size={20} className="text-emerald-400" />
              Published Documentation
            </h3>
            
            <div className="flex items-center justify-between p-4 bg-[#252525] rounded-xl">
              <div className="flex items-center gap-4">
                {currentSite?.is_published ? (
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <Globe size={22} className="text-emerald-400" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gray-700/50 flex items-center justify-center">
                    <Lock size={22} className="text-gray-400" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-white">
                    {currentSite?.is_published ? 'Published' : 'Private'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {currentSite?.is_published 
                      ? 'Your documentation is live and accessible to everyone'
                      : 'Only you can access this documentation'
                    }
                  </p>
                </div>
              </div>
              <Button 
                variant={currentSite?.is_published ? 'secondary' : 'primary'}
                onClick={handlePublishToggle}
                isLoading={isPublishing}
              >
                {currentSite?.is_published ? 'Unpublish' : 'Publish'}
              </Button>
            </div>

            {currentSite?.is_published && (
              <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <p className="text-sm text-emerald-400 font-medium mb-2">
                  Public URL
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-[#1c1c1c] text-gray-300 px-3 py-2 rounded-lg text-sm font-mono truncate">
                    {publicUrl}
                  </code>
                  <button
                    onClick={copyUrl}
                    className="p-2 rounded-lg bg-[#1c1c1c] hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    title="Copy URL"
                  >
                    {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
                  </button>
                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-[#1c1c1c] hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    title="Open in new tab"
                  >
                    <ExternalLink size={18} />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Danger Zone */}
          <div className="bg-[#1c1c1c] rounded-2xl border border-red-500/30 p-6">
            <h3 className="text-lg font-semibold text-red-400 mb-4">
              Danger Zone
            </h3>
            
            <div className="flex items-center justify-between p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <div>
                <p className="font-medium text-white">
                  Delete this site
                </p>
                <p className="text-sm text-gray-400">
                  Once deleted, this site and all its pages will be permanently removed. This action cannot be undone.
                </p>
              </div>
              <Button 
                variant="danger"
                onClick={handleDelete}
                isLoading={isDeleting}
              >
                <Trash2 size={16} />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SiteSettingsPage;
