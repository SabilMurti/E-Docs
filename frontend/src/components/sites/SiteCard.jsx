import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Globe } from 'lucide-react';

/**
 * SiteCard Component
 * 
 * @param {Object} props
 * @param {Object} props.site - Site data
 * @param {Function} props.onClick - Click handler
 * @param {number} props.delay - Animation delay in ms
 */
export default function SiteCard({ site, onClick, delay = 0 }) {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const handleClick = useCallback(() => {
    onClick?.();
  }, [onClick]);

  const spacesCount = site.spaces_count || site.spaces?.length || 0;

  return (
    <div
      className={`
        group relative rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)]
        hover:border-[var(--color-accent)]/30 transition-all duration-300
        ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      aria-label={`Open ${site.name} site`}
    >
      {/* Header */}
      <div className="h-20 rounded-t-xl bg-gradient-to-br from-[var(--color-accent)]/20 via-[var(--color-accent)]/10 to-transparent relative overflow-hidden">
        {/* Logo */}
        <div className="absolute bottom-2 left-3">
          <div className="w-9 h-9 rounded-lg bg-[var(--color-accent)] flex items-center justify-center shadow-lg">
            <Sparkles size={16} className="text-white" aria-hidden="true" />
          </div>
        </div>

        {/* Published Badge */}
        {site.is_published && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--color-accent)]/20 text-[var(--color-accent)] text-[10px]">
            <Globe size={10} aria-hidden="true" />
            <span>Published</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        <h3 className="font-semibold text-[var(--color-text-primary)] truncate mb-1">
          {site.name}
        </h3>
        {site.description && (
          <p className="text-xs text-[var(--color-text-muted)] line-clamp-2 mb-3">
            {site.description}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-[10px] text-[var(--color-text-muted)]">
          <span>{spacesCount} {spacesCount === 1 ? 'Space' : 'Spaces'}</span>
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </div>
      </div>
    </div>
  );
}
