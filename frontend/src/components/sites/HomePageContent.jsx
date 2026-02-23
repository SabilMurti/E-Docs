import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Settings } from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import useSiteStore from '../../stores/siteStore';
import ActionCard from '../sites/ActionCard';
import SiteCard from '../sites/SiteCard';
import TipCard from '../sites/TipCard';
import { Zap, Compass, BookMarked, ExternalLink } from 'lucide-react';

/**
 * SitesSection Component
 * 
 * Displays the list of user's sites with loading and empty states.
 */
function SitesSection({ sites, isLoading, onNavigate, onCreateSite }) {
  if (isLoading) {
    return (
      <div className="text-center py-10">
        <p className="text-[var(--color-text-muted)]">Loading sites...</p>
      </div>
    );
  }

  if (sites.length === 0) {
    return (
      <div className="bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border-primary)] p-10 text-center">
        <h3 className="text-base font-medium text-[var(--color-text-primary)] mb-1">No sites yet</h3>
        <p className="text-[var(--color-text-muted)] text-xs mb-5">
          Create your first documentation site to get started
        </p>
        <button
          onClick={onCreateSite}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors"
        >
          <Plus size={14} />
          Create Your First Site
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {sites.map((site, index) => (
        <SiteCard
          key={site.id}
          site={site}
          onClick={() => onNavigate(`/sites/${site.slug}`)}
          delay={300 + index * 100}
        />
      ))}
    </div>
  );
}

/**
 * QuickActions Component
 * 
 * Displays quick action cards.
 */
function QuickActions({ onCreateSite }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <ActionCard
        icon={Plus}
        title="Create New Site"
        subtitle="Start building your docs"
        onClick={onCreateSite}
        featured
        delay={100}
      />
      <ActionCard
        icon={BookMarked}
        title="Browse Templates"
        subtitle="Pre-built documentation"
        onClick={() => {}}
        delay={200}
      />
    </div>
  );
}

/**
 * TipsSection Component
 * 
 * Displays pro tips.
 */
function TipsSection() {
  return (
    <div>
      <h2 className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
        Pro Tips
      </h2>
      <div className="space-y-3">
        <TipCard
          icon={Zap}
          title="Quick Navigation"
          description="Use keyboard shortcuts for faster navigation."
          delay={400}
        />
        <TipCard
          icon={Compass}
          title="Organize Content"
          description="Create nested pages and sections."
          delay={500}
        />
        <TipCard
          icon={ExternalLink}
          title="Share Publicly"
          description="Publish sites to share with anyone."
          delay={600}
        />
      </div>
    </div>
  );
}

/**
 * HomePageContent Component
 * 
 * Main content of the home page.
 */
export default function HomePageContent() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { sites, fetchSites, createSite, isLoading } = useSiteStore();

  const handleCreateSite = useCallback(async (data) => {
    try {
      const result = await createSite(data);
      if (result.success && result.data?.slug) {
        navigate(`/sites/${result.data.slug}`);
      }
    } catch (error) {
      console.error('Error creating site:', error);
    }
  }, [createSite, navigate]);

  const firstName = useMemo(() => user?.name?.split(' ')[0] || 'there', [user?.name]);

  const getGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

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
            {getGreeting}, {firstName} 👋
          </h1>
          <p className="text-[var(--color-text-muted)] text-sm">
            Welcome back! Here's what's happening with your docs.
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Actions & Sites */}
          <div className="lg:col-span-2 space-y-5">
            <QuickActions onCreateSite={() => document.getElementById('create-site-modal')?.showModal()} />

            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Your Sites</h2>
                <button
                  onClick={() => document.getElementById('create-site-modal')?.showModal()}
                  className="text-xs text-[var(--color-accent)] hover:underline transition-colors"
                >
                  + New Site
                </button>
              </div>
              <SitesSection 
                sites={sites} 
                isLoading={isLoading} 
                onNavigate={navigate}
                onCreateSite={() => document.getElementById('create-site-modal')?.showModal()}
              />
            </div>
          </div>

          {/* Right Column - Tips */}
          <div className="lg:col-span-1">
            <TipsSection />
          </div>
        </div>
      </div>
    </div>
  );
}
