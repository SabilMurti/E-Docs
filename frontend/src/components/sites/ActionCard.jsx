import { useEffect, useState, useCallback } from 'react';
import { ArrowRight } from 'lucide-react';

/**
 * ActionCard Component
 * 
 * @param {Object} props
 * @param {Function} props.icon - Lucide icon component
 * @param {string} props.title - Card title
 * @param {string} props.subtitle - Card subtitle
 * @param {Function} props.onClick - Click handler
 * @param {number} props.delay - Animation delay in ms
 * @param {boolean} props.featured - Whether this is a featured card
 */
export default function ActionCard({ 
  icon: Icon, 
  title, 
  subtitle, 
  onClick, 
  delay = 0,
  featured = false 
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const handleClick = useCallback(() => {
    onClick?.();
  }, [onClick]);

  return (
    <button
      onClick={handleClick}
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
      aria-label={`${title}: ${subtitle}`}
    >
      <div className={`
        w-11 h-11 rounded-lg flex items-center justify-center transition-colors
        ${featured
          ? 'bg-[var(--color-accent)]/20 group-hover:bg-[var(--color-accent)]/30'
          : 'bg-[var(--color-bg-tertiary)] group-hover:bg-[var(--color-accent)]/20'}
      `}>
        <Icon 
          size={20} 
          className={`transition-colors ${featured ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)]'}`} 
          aria-hidden="true"
        />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-[var(--color-text-primary)] truncate">{title}</h3>
        {subtitle && <p className="text-xs text-[var(--color-text-muted)] mt-0.5 truncate">{subtitle}</p>}
      </div>
      <ArrowRight 
        size={16} 
        className="text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" 
        aria-hidden="true"
      />
    </button>
  );
}
