import { useState, useEffect } from 'react';
import { List } from 'lucide-react';

export default function TableOfContents({ content }) {
  const [headings, setHeadings] = useState([]);

  useEffect(() => {
    if (!content || !content.content) return;

    const extractedHeadings = content.content
      .filter(block => block.type === 'heading')
      .map((block, index) => ({
        id: `heading-${index}`,
        text: block.content?.[0]?.text || 'Untitled',
        level: block.attrs?.level || 1,
      }));

    setHeadings(extractedHeadings);
  }, [content]);

  if (headings.length === 0) return null;

  return (
    <div className="toc-container py-4">
      <div className="flex items-center gap-2 mb-4 text-[var(--color-text-muted)]">
        <List size={14} />
        <span className="text-[10px] font-bold uppercase tracking-wider">Table of Contents</span>
      </div>
      
      <nav className="space-y-1">
        {headings.map((heading) => (
          <button
            key={heading.id}
            onClick={() => {
              // Scroll to heading logic can be added here if ids are inserted into DOM
              const els = document.querySelectorAll(`h${heading.level}`);
              const target = Array.from(els).find(el => el.textContent === heading.text);
              if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
            className={`
              block w-full text-left text-xs transition-colors hover:text-[var(--color-accent)]
              ${heading.level === 1 ? 'font-semibold text-[var(--color-text-primary)]' : 
                heading.level === 2 ? 'pl-3 text-[var(--color-text-secondary)]' : 
                'pl-6 text-[var(--color-text-muted)]'}
            `}
          >
            {heading.text}
          </button>
        ))}
      </nav>
    </div>
  );
}
