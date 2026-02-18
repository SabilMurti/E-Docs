import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import React, { useState } from 'react';
import { Palette, ChevronDown, Check } from 'lucide-react';

const THEMES = [
  { id: 'surface', label: 'Default', bg: 'bg-[var(--color-bg-primary)]', border: 'border-gray-300 dark:border-gray-600' },
  { id: 'blue', label: 'Blue', bg: 'bg-blue-50/80 dark:bg-blue-900/20', border: 'border-blue-400 dark:border-blue-600' },
  { id: 'green', label: 'Green', bg: 'bg-green-50/80 dark:bg-green-900/20', border: 'border-green-400 dark:border-green-600' },
  { id: 'amber', label: 'Amber', bg: 'bg-amber-50/80 dark:bg-amber-900/20', border: 'border-amber-400 dark:border-amber-600' },
  { id: 'red', label: 'Red', bg: 'bg-red-50/80 dark:bg-red-900/20', border: 'border-red-400 dark:border-red-600' },
  { id: 'purple', label: 'Purple', bg: 'bg-purple-50/80 dark:bg-purple-900/20', border: 'border-purple-400 dark:border-purple-600' },
];

export default function CardComponent(props) {
  const { node, updateAttributes, selected } = props;
  const { theme } = node.attrs;
  const [showMenu, setShowMenu] = useState(false);

  const currentTheme = THEMES.find(t => t.id === theme) || THEMES[0];

  return (
    <NodeViewWrapper className="card-block my-6 relative group isolate">
      <div 
        className={`
          relative rounded-xl border-2 p-5 transition-all duration-300
          ${currentTheme.bg} ${currentTheme.border}
          shadow-md hover:shadow-xl hover:-translate-y-0.5
          ${selected ? 'ring-2 ring-[var(--color-accent)] ring-offset-2 ring-offset-[var(--color-bg-primary)] shadow-lg' : ''}
        `}
      >
        {/* Helper Menu (Visible on hover/select) */}
        <div 
          className={`absolute top-2 right-2 z-10 transition-opacity duration-200 ${selected || showMenu ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
        >
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded bg-[var(--color-bg-elevated)] border border-[var(--color-border-primary)] shadow-sm hover:text-[var(--color-accent)] transition-colors"
              title="Change Card Theme"
            >
              <Palette size={14} />
            </button>

            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowMenu(false)} 
                />
                <div className="absolute right-0 top-full mt-1 w-32 bg-[var(--color-bg-elevated)] border border-[var(--color-border-primary)] rounded-lg shadow-xl z-20 overflow-hidden py-1">
                  {THEMES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => {
                        updateAttributes({ theme: t.id });
                        setShowMenu(false);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-[var(--color-bg-hover)] text-left"
                    >
                      <div className={`w-3 h-3 rounded-full border ${t.bg.split(' ')[0]} ${t.border.split(' ')[0]}`} />
                      <span className="flex-1 text-[var(--color-text-primary)]">{t.label}</span>
                      {theme === t.id && <Check size={12} className="text-[var(--color-accent)]" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
        
        <NodeViewContent />
      </div>
    </NodeViewWrapper>
  );
}
