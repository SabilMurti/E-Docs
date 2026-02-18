import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  Plus, 
  FileText, 
  Users, 
  ArrowRight,
  Zap,
  Compass,
  BookMarked,
  ExternalLink,
  Sparkles,
  Globe,
  Layers,
  Settings
} from 'lucide-react';
import useAuthStore from '../stores/authStore';
import useSiteStore from '../stores/siteStore';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';

// Action Card Component
function ActionCard({ icon: Icon, title, subtitle, onClick, delay = 0, featured = false }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <button 
      onClick={onClick} 
      className={`
        flex items-center gap-4 p-5 rounded-xl border
        cursor-pointer transition-all duration-300
        hover:scale-[1.02] hover:-translate-y-0.5
        group text-left
        ${featured 
          ? 'border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5 hover:border-[var(--color-accent)]/50' 
          : 'border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] hover:border-[var(--color-border-hover)]'
        }
        ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
    >
      <div className={`
        w-11 h-11 rounded-lg flex items-center justify-center transition-colors
        ${featured 
          ? 'bg-[var(--color-accent)]/20 group-hover:bg-[var(--color-accent)]/30' 
          : 'bg-[var(--color-bg-tertiary)] group-hover:bg-[var(--color-accent)]/20'}
      `}>
        <Icon size={20} className={`transition-colors ${featured ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)]'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-[var(--color-text-primary)] truncate">{title}</h3>
        {subtitle && <p className="text-xs text-[var(--color-text-muted)] mt-0.5 truncate">{subtitle}</p>}
      </div>
      <ArrowRight size={16} className="text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
    </button>
  );
}

// Site Card Component
function SiteCard({ site, onClick, delay = 0 }) {
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const spacesCount = site.spaces_count || site.spaces?.length || 0;

  return (
    <div
      className={`
        group relative rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)]
        hover:border-[var(--color-accent)]/30 transition-all duration-300
        ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
    >
      {/* Header */}
      <div className="h-20 rounded-t-xl bg-gradient-to-br from-[var(--color-accent)]/20 via-[var(--color-accent)]/10 to-transparent relative overflow-hidden">
        {/* Logo */}
        <div className="absolute bottom-2 left-3">
          <div className="w-9 h-9 rounded-lg bg-[var(--color-accent)] flex items-center justify-center shadow-lg">
            <Sparkles size={16} className="text-white" />
          </div>
        </div>

        {/* Published Badge */}
        {site.is_published && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--color-accent)]/20 text-[var(--color-accent)] text-[10px]">
            <Globe size={10} />
            <span>Published</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <button onClick={onClick} className="text-left w-full">
          <h3 className="font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors truncate text-sm">
            {site.name}
          </h3>
          <p className="text-xs text-[var(--color-text-muted)] mt-1 line-clamp-2">
            {site.description || 'No description'}
          </p>
        </button>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--color-border-secondary)]">
          <div className="flex items-center gap-3 text-[10px] text-[var(--color-text-muted)]">
            <span className="flex items-center gap-1">
              <Layers size={11} />
              {spacesCount} {spacesCount === 1 ? 'page' : 'pages'}
            </span>
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/sites/${site.id}/settings`);
            }}
            className="p-1.5 rounded-md hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <Settings size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

// Tip Card Component
function TipCard({ icon: Icon, title, description, delay = 0 }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div 
      className={`
        p-3 rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-tertiary)]
        transition-all duration-300
        ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
    >
      <div className="w-7 h-7 rounded-md bg-[var(--color-accent)]/10 flex items-center justify-center mb-2">
        <Icon size={14} className="text-[var(--color-accent)]" />
      </div>
      <h4 className="font-medium text-[var(--color-text-primary)] text-xs mb-1">{title}</h4>
      <p className="text-[10px] text-[var(--color-text-muted)] leading-relaxed">{description}</p>
    </div>
  );
}

// Create Site Modal Component
function CreateSiteModal({ isOpen, onClose, onSubmit }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsLoading(true);
    try {
      await onSubmit({ name: name.trim(), description: description.trim() });
      setName('');
      setDescription('');
      onClose();
    } catch (error) {
      console.error('Modal submit error:', error);
      // Don't close on error
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[var(--color-bg-elevated)] rounded-xl border border-[var(--color-border-primary)] p-6 mx-4">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Create New Site</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              Site Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Documentation"
              className="w-full px-3 py-2.5 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)]/50 text-sm"
              autoFocus
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this documentation about?"
              rows={3}
              className="w-full px-3 py-2.5 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)]/50 resize-none text-sm"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--color-border-primary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isLoading}
              className="flex-1 px-4 py-2.5 rounded-lg bg-[var(--color-accent)] text-white font-medium hover:bg-[var(--color-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              {isLoading ? 'Creating...' : 'Create Site'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { sites, fetchSites, createSite, isLoading } = useSiteStore();
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  const handleCreateSite = async (data) => {
    console.log('Creating site with data:', data);
    try {
      const result = await createSite(data);
      console.log('Create site result:', result);
      if (result.success && result.data?.id) {
        navigate(`/sites/${result.data.id}`);
      } else {
        console.error('Create site failed:', result.error);
        toast.error('Failed to create site: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Create site exception:', error);
      toast.error('Error creating site: ' + error.message);
    }
  };

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.name?.split(' ')[0] || 'there';

  if (isLoading && sites.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="px-2 py-0.5 rounded-full bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20">
              <span className="text-[10px] font-medium text-[var(--color-accent)]">E-Docs</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-1">
            {getGreeting()}, {firstName} 👋
          </h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Build beautiful documentation sites in minutes
          </p>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Column - Sites */}
          <div className="lg:col-span-3 space-y-5">
            {/* Action Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ActionCard
                icon={Plus}
                title="Create New Site"
                subtitle="Start building your docs"
                onClick={() => setShowCreateModal(true)}
                featured
                delay={100}
              />
              <ActionCard
                icon={FileText}
                title="Browse Templates"
                subtitle="Pre-built documentation"
                onClick={() => {}}
                delay={200}
              />
            </div>

            {/* Sites Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Your Sites</h2>
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="text-xs text-[var(--color-accent)] hover:underline transition-colors"
                >
                  + New Site
                </button>
              </div>

              {sites.length === 0 ? (
                <div className="bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border-primary)] p-10 text-center">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-[var(--color-bg-tertiary)] flex items-center justify-center">
                    <Layers size={28} className="text-[var(--color-text-muted)]" />
                  </div>
                  <h3 className="text-base font-medium text-[var(--color-text-primary)] mb-1">No sites yet</h3>
                  <p className="text-[var(--color-text-muted)] text-xs mb-5">
                    Create your first documentation site to get started
                  </p>
                  <Button onClick={() => setShowCreateModal(true)}>
                    <Plus size={14} />
                    Create Your First Site
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {sites.map((site, index) => (
                    <SiteCard
                      key={site.id}
                      site={site}
                      onClick={() => navigate(`/sites/${site.id}`)}
                      delay={300 + index * 100}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Tips */}
          <div className="lg:col-span-2 space-y-3">
            <h2 className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
              Pro Tips
            </h2>
            
            <TipCard
              icon={Zap}
              title="Quick Navigation"
              description="Use / to search anywhere in your docs."
              delay={400}
            />
            
            <TipCard
              icon={Compass}
              title="Organize Content"
              description="Create nested pages and sections."
              delay={500}
            />
            
            <TipCard
              icon={BookMarked}
              title="Publish Instantly"
              description="One click to share your documentation."
              delay={600}
            />
            
            <TipCard
              icon={Users}
              title="Collaborate"
              description="Invite team members to edit together."
              delay={700}
            />

            {/* Quick Link */}
            <a 
              href="/help"
              className="flex items-center gap-2 p-3 rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent)]/20 transition-all group"
            >
              <ExternalLink size={14} />
              <span className="text-xs">View Documentation</span>
              <ArrowRight size={12} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          </div>
        </div>
      </div>

      {/* Create Site Modal */}
      <CreateSiteModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateSite}
      />
    </div>
  );
}

export default HomePage;
