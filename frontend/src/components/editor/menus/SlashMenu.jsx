/**
 * SlashMenu - Self-contained slash command menu
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { getAllBlocks } from '../BlockDefinitions';

export default function SlashMenu({
  editor,
  query = '',
  position,
  onClose
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef(null);
  const itemRefs = useRef([]);

  // Filter blocks based on query
  const filteredBlocks = useMemo(() => {
    const allBlocks = getAllBlocks();
    if (!query) return allBlocks;
    const q = query.toLowerCase();
    return allBlocks.filter(block =>
      block.name.toLowerCase().includes(q) ||
      block.description.toLowerCase().includes(q) ||
      block.id.toLowerCase().includes(q)
    );
  }, [query]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll selected item into view
  useEffect(() => {
    const selectedEl = itemRefs.current[selectedIndex];
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  // Select and execute block action
  const selectItem = useCallback((item, e) => {
    if (!item || !editor) return;
    if (e) { e.preventDefault(); e.stopPropagation(); }

    // Re-focus editor first to ensure selection is valid
    editor.view.focus();

    // Delete the slash command text (slash + query)
    const { from } = editor.state.selection;
    const deleteFrom = from - (query.length + 1); // +1 for the slash
    if (deleteFrom >= 0) {
      editor.commands.deleteRange({ from: deleteFrom, to: from });
    }

    // Execute the block action
    try {
      item.action(editor);
    } catch (err) {
      console.warn('Block action failed:', err);
    }

    onClose();
  }, [editor, query, onClose]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!filteredBlocks.length) return;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          e.stopPropagation();
          setSelectedIndex(prev =>
            prev <= 0 ? filteredBlocks.length - 1 : prev - 1
          );
          break;

        case 'ArrowDown':
          e.preventDefault();
          e.stopPropagation();
          setSelectedIndex(prev =>
            prev >= filteredBlocks.length - 1 ? 0 : prev + 1
          );
          break;

        case 'Enter':
          e.preventDefault();
          e.stopPropagation();
          selectItem(filteredBlocks[selectedIndex]);
          break;

        case 'Escape':
          e.preventDefault();
          e.stopPropagation();
          onClose();
          break;

        case 'Tab':
          e.preventDefault();
          e.stopPropagation();
          setSelectedIndex(prev =>
            prev >= filteredBlocks.length - 1 ? 0 : prev + 1
          );
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [filteredBlocks, selectedIndex, selectItem, onClose]);

  // Close on click outside
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  // Group filtered blocks by category
  const groupedBlocks = useMemo(() => {
    return filteredBlocks.reduce((acc, block) => {
      if (!acc[block.category]) acc[block.category] = [];
      acc[block.category].push(block);
      return acc;
    }, {});
  }, [filteredBlocks]);

  // Empty state message
  const isEmpty = filteredBlocks.length === 0;

  // Build item index map for keyboard navigation
  let itemIndex = 0;

  return createPortal(
    <div
      ref={menuRef}
      className="slash-menu fixed z-[9999] w-72 bg-[color:var(--color-bg-elevated)] border border-[color:var(--color-border-primary)] rounded-xl shadow-xl overflow-hidden animate-scaleIn"
      style={{ top: position.top, left: position.left }}
    >
      {/* Header */}
      <div className="px-3 py-2 border-b border-[color:var(--color-border-secondary)]">
        <span className="text-xs font-medium text-[color:var(--color-text-muted)]">
          {isEmpty ? 'No results' : 'Insert block'}
        </span>
      </div>

      {/* Items or Empty State */}
      {isEmpty ? (
        <div className="px-4 py-6 text-center">
          <p className="text-sm text-[color:var(--color-text-muted)]">
            No blocks found for "{query}"
          </p>
        </div>
      ) : (
        <div className="max-h-80 overflow-y-auto p-1">
          {Object.entries(groupedBlocks).map(([category, blocks], catIndex) => (
            <div key={category}>
              {catIndex > 0 && (
                <div className="my-1 mx-2 border-t border-[color:var(--color-border-secondary)]" />
              )}
              <div className="px-2 py-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--color-text-muted)]">
                  {category}
                </span>
              </div>
              {blocks.map((block) => {
                const currentIndex = itemIndex++;
                const Icon = block.icon;
                const isSelected = currentIndex === selectedIndex;

                return (
                  <button
                    key={block.id}
                    ref={(el) => itemRefs.current[currentIndex] = el}
                    onMouseDown={(e) => selectItem(block, e)}
                    onMouseEnter={() => setSelectedIndex(currentIndex)}
                    className={`
                      w-full flex items-center gap-3 px-2 py-1.5 rounded-lg text-left transition-colors
                      ${isSelected
                        ? 'bg-[color:var(--color-accent-light)] text-[color:var(--color-accent)]'
                        : 'hover:bg-[color:var(--color-bg-hover)]'
                      }
                    `}
                  >
                    <div className={`
                      w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                      ${isSelected
                        ? 'bg-[color:var(--color-accent)] text-white'
                        : 'bg-[color:var(--color-bg-secondary)] text-[color:var(--color-text-muted)]'
                      }
                      ${block.iconColor && !isSelected ? block.iconColor : ''}
                    `}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[color:var(--color-text-primary)]">
                        {block.name}
                      </div>
                      <div className="text-xs text-[color:var(--color-text-muted)] truncate">
                        {block.description}
                      </div>
                    </div>
                    {block.shortcut && (
                      <div className="text-xs text-[color:var(--color-text-muted)] font-mono">
                        {block.shortcut}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Footer hint */}
      {!isEmpty && (
        <div className="px-3 py-2 border-t border-[color:var(--color-border-secondary)] flex items-center gap-2 text-[10px] text-[color:var(--color-text-muted)]">
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-[color:var(--color-bg-tertiary)] rounded text-[9px]">↑↓</kbd>
            Navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-[color:var(--color-bg-tertiary)] rounded text-[9px]">↵</kbd>
            Select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-[color:var(--color-bg-tertiary)] rounded text-[9px]">Esc</kbd>
            Close
          </span>
        </div>
      )}
    </div>,
    document.body
  );
}
