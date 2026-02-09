import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Settings, Users, Globe, Lock, Trash2, ArrowLeft, Copy, Check, ExternalLink } from 'lucide-react';
import useSpaceStore from '../stores/spaceStore';
import useAuthStore from '../stores/authStore';
import MemberList from '../components/members/MemberList';
import SpaceForm from '../components/spaces/SpaceForm';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';

function SettingsPage() {
  const { spaceId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentSpace, fetchSpace, updateSpace, deleteSpace, publishSpace, unpublishSpace, isLoading } = useSpaceStore();
  
  const [activeTab, setActiveTab] = useState('general');
  const [showEditForm, setShowEditForm] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (spaceId) {
      fetchSpace(spaceId);
    }
  }, [spaceId, fetchSpace]);

  const handleUpdate = async (data) => {
    const result = await updateSpace(spaceId, data);
    if (result.success) {
      setShowEditForm(false);
    }
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
    if (!confirm('Are you sure you want to delete this workspace? This action cannot be undone.')) {
      return;
    }
    
    setIsDeleting(true);
    const result = await deleteSpace(spaceId);
    if (result.success) {
      navigate('/');
    }
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
      <div className="min-h-screen flex items-center justify-center bg-[#141414]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'members', label: 'Members', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-[#141414]">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate(`/spaces/${spaceId}`)}
            className="p-2 rounded-lg hover:bg-white/10 text-gray-400 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">
              Workspace Settings
            </h1>
            <p className="text-gray-400">
              {currentSpace?.name}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-[#1c1c1c] p-1 rounded-xl border border-white/10 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg
                text-sm font-medium transition-all duration-200
                ${activeTab === tab.id 
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                }
              `}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            {/* Space Info */}
            <div className="bg-[#1c1c1c] rounded-2xl border border-white/10 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    {currentSpace?.name}
                  </h2>
                  <p className="text-gray-400 mt-1">
                    {currentSpace?.description || 'No description'}
                  </p>
                </div>
                <Button variant="secondary" onClick={() => setShowEditForm(true)}>
                  Edit
                </Button>
              </div>
            </div>

            {/* Publishing */}
            <div className="bg-[#1c1c1c] rounded-2xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Globe size={20} className="text-emerald-400" />
                Published Documentation
              </h3>
              
              <div className="flex items-center justify-between p-4 bg-[#252525] rounded-xl">
                <div className="flex items-center gap-4">
                  {currentSpace?.is_published ? (
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
                      {currentSpace?.is_published ? 'Published' : 'Private'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {currentSpace?.is_published 
                        ? 'Your documentation is live and accessible to everyone'
                        : 'Only workspace members can access this content'
                      }
                    </p>
                  </div>
                </div>
                <Button 
                  variant={currentSpace?.is_published ? 'secondary' : 'primary'}
                  onClick={handlePublishToggle}
                  isLoading={isPublishing}
                >
                  {currentSpace?.is_published ? 'Unpublish' : 'Publish'}
                </Button>
              </div>

              {currentSpace?.is_published && (
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
                    Delete this workspace
                  </p>
                  <p className="text-sm text-gray-400">
                    Once deleted, this workspace and all its pages will be permanently removed.
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
        )}

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
      </div>
    </div>
  );
}

export default SettingsPage;
