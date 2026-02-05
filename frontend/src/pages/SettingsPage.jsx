import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Settings, Users, Globe, Lock, Trash2, ArrowLeft } from 'lucide-react';
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
    if (!confirm('Are you sure you want to delete this space? This action cannot be undone.')) {
      return;
    }
    
    setIsDeleting(true);
    const result = await deleteSpace(spaceId);
    if (result.success) {
      navigate('/');
    }
    setIsDeleting(false);
  };

  if (isLoading && !currentSpace) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'members', label: 'Members', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-bg-secondary)]">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate(`/spaces/${spaceId}`)}
            className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
              Space Settings
            </h1>
            <p className="text-[var(--color-text-secondary)]">
              {currentSpace?.name}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-[var(--color-bg-primary)] p-1 rounded-lg border border-[var(--color-border)] w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg
                text-sm font-medium transition-colors
                ${activeTab === tab.id 
                  ? 'bg-[var(--color-accent)] text-white' 
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]'
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
            <div className="bg-[var(--color-bg-primary)] rounded-xl border border-[var(--color-border)] p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                    {currentSpace?.name}
                  </h2>
                  <p className="text-[var(--color-text-secondary)] mt-1">
                    {currentSpace?.description || 'No description'}
                  </p>
                </div>
                <Button variant="secondary" onClick={() => setShowEditForm(true)}>
                  Edit
                </Button>
              </div>
            </div>

            {/* Visibility */}
            <div className="bg-[var(--color-bg-primary)] rounded-xl border border-[var(--color-border)] p-6">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
                Visibility
              </h3>
              
              <div className="flex items-center justify-between p-4 bg-[var(--color-bg-secondary)] rounded-lg">
                <div className="flex items-center gap-3">
                  {currentSpace?.is_published ? (
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Globe size={20} className="text-green-600" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <Lock size={20} className="text-gray-600" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-[var(--color-text-primary)]">
                      {currentSpace?.is_published ? 'Public' : 'Private'}
                    </p>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      {currentSpace?.is_published 
                        ? 'Anyone with the link can view this space'
                        : 'Only members can access this space'
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

              {currentSpace?.is_published && currentSpace?.slug && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    Public URL: <code className="bg-blue-100 px-1.5 py-0.5 rounded">/public/{currentSpace.slug}</code>
                  </p>
                </div>
              )}
            </div>

            {/* Danger Zone */}
            <div className="bg-[var(--color-bg-primary)] rounded-xl border border-red-200 p-6">
              <h3 className="text-lg font-semibold text-red-600 mb-4">
                Danger Zone
              </h3>
              
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <div>
                  <p className="font-medium text-[var(--color-text-primary)]">
                    Delete this space
                  </p>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Once deleted, this space and all its pages will be permanently removed.
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
