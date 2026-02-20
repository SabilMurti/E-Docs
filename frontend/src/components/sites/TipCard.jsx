import { useEffect, useState } from 'react';

/**
 * TipCard Component
 * 
 * @param {Object} props
 * @param {Function} props.icon - Lucide icon component
 * @param {string} props.title - Tip title
 * @param {string} props.description - Tip description
 * @param {number} props.delay - Animation delay in ms
 */
export default function TipCard({ icon: Icon, title, description, delay = 0 }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`
        p-4 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)]
        transition-all duration-300 hover:border-[var(--color-accent)]/30
        ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center shrink-0">
          <Icon size={16} className="text-[var(--color-accent)]" aria-hidden="true" />
        </div>
        <div>
          <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-0.5">
            {title}
          </h4>
          <p className="text-xs text-[var(--color-text-muted)]">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
