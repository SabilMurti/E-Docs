import { useState, useEffect, useRef } from 'react';
import { BLOCK_DEFINITIONS, searchBlocks } from './BlockDefinitions';

export default function SlashCommandMenu({ 
  editor, 
  query = '', 
  position, 
  onClose,
  selectedIndex: rawSelectedIndex = 0,
  enterPressed = null
}) {
  // We use rawSelectedIndex from parent but normalize it locally based on filtered length
  const [normalizedIndex, setNormalizedIndex] = useState(0);
  const menuRef = useRef(null);
  
  // Filter blocks based on query
  const filteredBlocks = searchBlocks(query);
  
  // Update normalized index when raw index or query changes
  useEffect(() => {
    if (filteredBlocks.length === 0) {
      setNormalizedIndex(0);
      return;
    }
    const len = filteredBlocks.length;
    // Handle wrapping correctly for negative numbers
    const newIndex = ((rawSelectedIndex % len) + len) % len;
    setNormalizedIndex(newIndex);
  }, [rawSelectedIndex, query, filteredBlocks.length]);

  // Handle Enter key press
  useEffect(() => {
    if (enterPressed && filteredBlocks.length > 0) {
      selectItem(filteredBlocks[normalizedIndex]);
    }
  }, [enterPressed]);

  // Removed internal keyboard listener (useEffect) as it is now handled by PageEditor

  // Scroll selected item into view
  useEffect(() => {
    if (menuRef.current) {
      const selectedEl = menuRef.current.querySelector(`[data-index="${normalizedIndex}"]`);
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [normalizedIndex]);

  const selectItem = (item) => {
    if (!item) return;
    
    // Delete the slash command text
    const { from } = editor.state.selection;
    editor.commands.deleteRange({ from: from - (query.length + 1), to: from });
    
    // Execute the block action
    item.action(editor);
    onClose();
  };

  if (filteredBlocks.length === 0) {
    return (
      <div
        className="editor-menu absolute z-50 w-80 animate-scaleIn"
        style={{ top: position.top, left: position.left }}
      >
        <div className="p-4 text-center text-[color:var(--color-text-muted)]">
          No blocks found for "{query}"
        </div>
      </div>
    );
  }

  // Group filtered blocks by category
  const groupedBlocks = filteredBlocks.reduce((acc, block) => {
    if (!acc[block.category]) {
      acc[block.category] = [];
    }
    acc[block.category].push(block);
    return acc;
  }, {});

  let itemIndex = 0;

  return (
    <div
      ref={menuRef}
      className="editor-menu absolute z-50 w-80 animate-scaleIn"
      style={{ top: position.top, left: position.left }}
    >
      <div className="editor-menu-header">
        Insert block...
      </div>
      
      <div className="max-h-80 overflow-y-auto p-1">
        {Object.entries(groupedBlocks).map(([category, blocks], catIndex) => (
          <div key={category}>
            {catIndex > 0 && (
              <div className="mx-2 my-1 border-t border-[color:var(--color-border-secondary)]" />
            )}
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[color:var(--color-text-muted)]">
              {category}
            </div>
            {blocks.map((block) => {
              const currentIndex = itemIndex++;
              const Icon = block.icon;
              const isSelected = currentIndex === normalizedIndex;
              
              return (
                <button
                  key={block.id}
                  data-index={currentIndex}
                  onClick={() => selectItem(block)}
                  className={`editor-menu-item ${isSelected ? 'active' : ''}`}
                >
                  <div className="editor-menu-item-icon">
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="editor-menu-item-label">{block.name}</div>
                    <div className="editor-menu-item-description truncate">
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
    </div>
  );
}
