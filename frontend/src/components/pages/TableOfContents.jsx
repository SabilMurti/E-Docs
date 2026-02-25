import { useState, useEffect, useRef } from 'react';

export default function TableOfContents({ content }) {
  const [headings, setHeadings] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const observerRef = useRef(null);

  useEffect(() => {
    if (!content) return;
    const doc = typeof content === 'string' ? JSON.parse(content) : content;
    if (!doc?.content) return;

    const extracted = doc.content
      .filter(block => block.type === 'heading' && block.attrs?.level <= 3)
      .map((block, index) => ({
        id: `heading-${index}`,
        text: block.content?.map(c => c.text || '').join('') || 'Untitled',
        level: block.attrs?.level || 1,
      }));

    setHeadings(extracted);
  }, [content]);

  // Scroll spy - observe heading elements in the DOM
  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-10% 0% -70% 0%', threshold: 0 }
    );

    observerRef.current = observer;

    const timer = setTimeout(() => {
      headings.forEach(({ id }) => {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
      });
    }, 300);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [headings]);

  if (headings.length === 0) return null;

  const handleClick = (heading) => {
    const el = document.getElementById(heading.id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveId(heading.id);
    }
  };

  return (
    <div className="toc-container">
      <p
        className="text-[11px] font-semibold uppercase tracking-wider mb-3"
        style={{ color: 'var(--public-text-muted)' }}
      >
        On this page
      </p>

      <nav className="space-y-0.5">
        {headings.map((heading) => {
          const isActive = activeId === heading.id;
          return (
            <button
              key={heading.id}
              onClick={() => handleClick(heading)}
              className="block w-full text-left text-xs py-1 transition-all duration-150 rounded"
              style={{
                paddingLeft: heading.level === 1 ? '0' : heading.level === 2 ? '10px' : '18px',
                color: isActive ? '#10b981' : 'var(--public-text-muted)',
                fontWeight: isActive ? '500' : '400',
                borderLeft: heading.level > 1 ? `2px solid ${isActive ? '#10b981' : 'var(--public-border)'}` : 'none',
              }}
            >
              <span className="line-clamp-2 leading-snug">
                {heading.text}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
