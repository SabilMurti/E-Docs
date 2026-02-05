import { useEffect, useState } from 'react';
import { Plus, FolderOpen } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import useSpaceStore from '../stores/spaceStore';
import SpaceCard from '../components/spaces/SpaceCard';
import SpaceForm from '../components/spaces/SpaceForm';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';

function HomePage() {
  const { user } = useAuthStore();
  const { spaces, isLoading, error, fetchSpaces, createSpace, deleteSpace } = useSpaceStore();
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetchSpaces();
  }, [fetchSpaces]);

  const handleCreateSpace = async (data) => {
    const result = await createSpace(data);
    if (result.success) {
      setShowCreateForm(false);
    }
    return result;
  };

  const handleDeleteSpace = async (id) => {
    await deleteSpace(id);
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-secondary)]">
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
              Welcome back, {user?.name?.split(' ')[0] || 'there'}!
            </h1>
            <p className="text-[var(--color-text-secondary)] mt-1">
              Manage your documentation spaces
            </p>
          </div>
          <Button 
            variant="primary" 
            onClick={() => setShowCreateForm(true)}
          >
            <Plus size={18} />
            New Space
          </Button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
             <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
               <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
               </svg>
             </div>
             <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">Failed to load spaces</h3>
             <p className="text-[var(--color-text-secondary)] mb-6">{error}</p>
             <Button variant="primary" onClick={() => fetchSpaces()}>Try Again</Button>
          </div>
        ) : spaces.length === 0 ? (
          /* Empty State */
          <div className="
            flex flex-col items-center justify-center py-20
            text-center
          ">
            <div className="
              w-20 h-20 mb-6
              bg-[var(--color-bg-tertiary)]
              rounded-full flex items-center justify-center
            ">
              <FolderOpen size={40} className="text-[var(--color-text-muted)]" />
            </div>
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
              No spaces yet
            </h2>
            <p className="text-[var(--color-text-secondary)] mb-6 max-w-md">
              Create your first documentation space to get started. 
              You can invite team members and organize your docs.
            </p>
            <Button 
              variant="primary" 
              size="lg"
              onClick={() => setShowCreateForm(true)}
            >
              <Plus size={18} />
              Create your first space
            </Button>
          </div>
        ) : (
          /* Space Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {spaces.map((space) => (
              <SpaceCard 
                key={space.id} 
                space={space}
                onDelete={handleDeleteSpace}
              />
            ))}
          </div>
        )}

        {/* Create Form Modal */}
        <SpaceForm
          isOpen={showCreateForm}
          onClose={() => setShowCreateForm(false)}
          onSubmit={handleCreateSpace}
        />
      </div>
    </div>
  );
}

export default HomePage;
