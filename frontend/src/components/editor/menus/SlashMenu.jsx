/**
 * SlashMenu - Self-contained slash command menu
 * 
 * Features:
 * - Self-contained keyboard navigation (no lifted state)
 * - Smooth scroll to selected item
 * - Grouped by category
 * - Search/filter by query
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Type, Heading1, Heading2, Heading3,
  List, ListOrdered, CheckSquare, Minus,
  Quote, Code2, Info, AlertTriangle, CheckCircle2, XCircle,
  Table as TableIcon, Image as ImageIcon,
  Youtube, FileUp, ChevronRight,
  Columns as ColumnsIcon, LayoutGrid, PanelLeft, PanelRight,
  Square, Network
} from 'lucide-react';

// Block definitions with categories
const BLOCKS = [
  {
    category: 'Text',
    items: [
      { id: 'paragraph', name: 'Text', icon: Type, description: 'Plain text', shortcut: null,
        action: (editor) => editor.chain().focus().setParagraph().run() },
      { id: 'heading1', name: 'Heading 1', icon: Heading1, description: 'Large heading', shortcut: '#',
        action: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run() },
      { id: 'heading2', name: 'Heading 2', icon: Heading2, description: 'Medium heading', shortcut: '##',
        action: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run() },
      { id: 'heading3', name: 'Heading 3', icon: Heading3, description: 'Small heading', shortcut: '###',
        action: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run() },
    ]
  },
  {
    category: 'Lists',
    items: [
      { id: 'bulletList', name: 'Bullet List', icon: List, description: 'Unordered list', shortcut: '-',
        action: (editor) => editor.chain().focus().toggleBulletList().run() },
      { id: 'orderedList', name: 'Numbered List', icon: ListOrdered, description: 'Ordered list', shortcut: '1.',
        action: (editor) => editor.chain().focus().toggleOrderedList().run() },
      { id: 'taskList', name: 'Task List', icon: CheckSquare, description: 'Checklist', shortcut: '[]',
        action: (editor) => editor.chain().focus().toggleTaskList().run() },
    ]
  },
  {
    category: 'Blocks',
    items: [
      { id: 'quote', name: 'Quote', icon: Quote, description: 'Blockquote', shortcut: '>',
        action: (editor) => editor.chain().focus().toggleBlockquote().run() },
      { id: 'codeBlock', name: 'Code Block', icon: Code2, description: 'Code with syntax', shortcut: '```',
        action: (editor) => editor.chain().focus().toggleCodeBlock().run() },
      { id: 'divider', name: 'Divider', icon: Minus, description: 'Horizontal line', shortcut: '---',
        action: (editor) => editor.chain().focus().setHorizontalRule().run() },
      { id: 'table', name: 'Table', icon: TableIcon, description: 'Data table',
        action: (editor) => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
      { id: 'toggle', name: 'Toggle', icon: ChevronRight, description: 'Collapsible content',
        action: (editor) => editor.chain().focus().setToggle().run() },
      { id: 'card', name: 'Card', icon: Square, description: 'Styled container',
        action: (editor) => editor.chain().focus().setCard().run() },
    ]
  },
  {
    category: 'Callouts',
    items: [
      { id: 'callout-info', name: 'Info', icon: Info, description: 'Informational note', iconColor: 'text-blue-500',
        action: (editor) => editor.chain().focus().setCallout({ type: 'info' }).run() },
      { id: 'callout-success', name: 'Success', icon: CheckCircle2, description: 'Success message', iconColor: 'text-green-500',
        action: (editor) => editor.chain().focus().setCallout({ type: 'success' }).run() },
      { id: 'callout-warning', name: 'Warning', icon: AlertTriangle, description: 'Warning note', iconColor: 'text-amber-500',
        action: (editor) => editor.chain().focus().setCallout({ type: 'warning' }).run() },
      { id: 'callout-danger', name: 'Danger', icon: XCircle, description: 'Danger alert', iconColor: 'text-red-500',
        action: (editor) => editor.chain().focus().setCallout({ type: 'danger' }).run() },
    ]
  },
  {
    category: 'Media',
    items: [
      { id: 'image', name: 'Image', icon: ImageIcon, description: 'Upload or embed image',
        action: (editor) => {
          const url = window.prompt('Enter image URL:');
          if (url) editor.chain().focus().setImage({ src: url }).run();
        }},
      { id: 'youtube', name: 'YouTube', icon: Youtube, description: 'Embed video',
        action: (editor) => {
          const url = window.prompt('Enter YouTube URL:');
          if (url) editor.chain().focus().setYoutubeVideo({ src: url }).run();
        }},
      { id: 'file', name: 'File', icon: FileUp, description: 'Attach file',
        action: (editor) => {
          const url = window.prompt('Enter file URL:');
          if (url) {
            const name = url.split('/').pop() || 'File';
            editor.chain().focus().insertContent(`<p><a href="${url}" target="_blank">📎 ${name}</a></p>`).run();
          }
        }},
    ]
  },
  {
    category: 'Layout',
    items: [
      { id: '2col', name: '2 Columns', icon: ColumnsIcon, description: 'Two equal columns',
        action: (editor) => editor.chain().focus().setColumns({ layout: 'two-columns' }).run() },
      { id: '3col', name: '3 Columns', icon: LayoutGrid, description: 'Three equal columns',
        action: (editor) => editor.chain().focus().setColumns({ layout: 'three-columns' }).run() },
      { id: 'left-sidebar', name: 'Sidebar Left', icon: PanelLeft, description: 'Small left, large right',
        action: (editor) => editor.chain().focus().setColumns({ layout: 'sidebar-left' }).run() },
      { id: 'right-sidebar', name: 'Sidebar Right', icon: PanelRight, description: 'Large left, small right',
        action: (editor) => editor.chain().focus().setColumns({ layout: 'sidebar-right' }).run() },
    ]
  },
];

// Flatten all blocks for filtering
const getAllBlocks = () => BLOCKS.flatMap(cat => 
  cat.items.map(item => ({ ...item, category: cat.category }))
);

// Filter blocks by query
const filterBlocks = (query) => {
  if (!query) return getAllBlocks();
  const q = query.toLowerCase();
  return getAllBlocks().filter(block =>
    block.name.toLowerCase().includes(q) ||
    block.description.toLowerCase().includes(q) ||
    block.id.toLowerCase().includes(q)
  );
};

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
  const filteredBlocks = useMemo(() => filterBlocks(query), [query]);
  
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
  const selectItem = useCallback((item) => {
    if (!item || !editor) return;
    
    // Delete the slash command text first
    const { from } = editor.state.selection;
    const deleteFrom = from - (query.length + 1); // +1 for the slash
    editor.commands.deleteRange({ from: deleteFrom, to: from });
    
    // Execute the block action
    try {
      item.action(editor);
    } catch (err) {
      console.warn('Block action failed:', err);
    }
    
    onClose();
  }, [editor, query, onClose]);
  
  // Keyboard navigation - self-contained!
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
    
    // Capture phase to intercept before Tiptap
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
  
  // Empty state
  if (filteredBlocks.length === 0) {
    return createPortal(
      <div
        ref={menuRef}
        className="slash-menu fixed z-[9999] w-72 bg-[color:var(--color-bg-elevated)] border border-[color:var(--color-border-primary)] rounded-xl shadow-xl overflow-hidden animate-scaleIn"
        style={{ top: position.top, left: position.left }}
      >
        <div className="px-4 py-6 text-center">
          <p className="text-sm text-[color:var(--color-text-muted)]">
            No blocks found for "{query}"
          </p>
        </div>
      </div>,
      document.body
    );
  }
  
  // Group filtered blocks by category
  const groupedBlocks = useMemo(() => {
    return filteredBlocks.reduce((acc, block) => {
      if (!acc[block.category]) acc[block.category] = [];
      acc[block.category].push(block);
      return acc;
    }, {});
  }, [filteredBlocks]);
  
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
          Insert block
        </span>
      </div>
      
      {/* Items */}
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
                  onClick={() => selectItem(block)}
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
      
      {/* Footer hint */}
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
    </div>,
    document.body
  );
}
