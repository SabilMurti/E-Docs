/**
 * InsertToolbar - Fixed toolbar for inserting block types
 * 
 * Provides quick access to insert various content blocks,
 * undo/redo, and block transformation.
 */

import { useState, useRef, useEffect } from 'react';
import {
  Plus,
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Table,
  Image as ImageIcon,
  Minus,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronRight,
  Youtube,
  Square,
  Columns as ColumnsIcon,
  LayoutGrid,
  PanelLeft,
  PanelRight,
  Undo2,
  Redo2,
  ArrowRightLeft,
  PenTool,
} from 'lucide-react';
import { TableCreationModal } from './TablePlus';

// Block categories and definitions
const BLOCK_CATEGORIES = [
  {
    name: 'Text',
    blocks: [
      { id: 'paragraph', label: 'Paragraph', icon: Type, shortcut: '⌘+Alt+0' },
      { id: 'h1', label: 'Heading 1', icon: Heading1, shortcut: '⌘+Alt+1' },
      { id: 'h2', label: 'Heading 2', icon: Heading2, shortcut: '⌘+Alt+2' },
      { id: 'h3', label: 'Heading 3', icon: Heading3, shortcut: '⌘+Alt+3' },
    ]
  },
  {
    name: 'Lists',
    blocks: [
      { id: 'bullet', label: 'Bullet List', icon: List },
      { id: 'numbered', label: 'Numbered List', icon: ListOrdered },
      { id: 'task', label: 'Task List', icon: CheckSquare },
    ]
  },
  {
    name: 'Blocks',
    blocks: [
      { id: 'quote', label: 'Quote', icon: Quote },
      { id: 'code', label: 'Code Block', icon: Code },
      { id: 'divider', label: 'Divider', icon: Minus },
      { id: 'toggle', label: 'Toggle', icon: ChevronRight },
      { id: 'card', label: 'Card', icon: Square },
    ]
  },
  {
    name: 'Callouts',
    blocks: [
      { id: 'callout-info', label: 'Info', icon: AlertCircle, color: 'text-blue-500' },
      { id: 'callout-success', label: 'Success', icon: CheckCircle2, color: 'text-emerald-500' },
      { id: 'callout-warning', label: 'Warning', icon: AlertTriangle, color: 'text-amber-500' },
      { id: 'callout-danger', label: 'Danger', icon: XCircle, color: 'text-red-500' },
    ]
  },
  {
    name: 'Media',
    blocks: [
      { id: 'image', label: 'Image', icon: ImageIcon },
      { id: 'youtube', label: 'YouTube', icon: Youtube },
      { id: 'table', label: 'Table', icon: Table },
      { id: 'flowchart', label: 'Flowchart', icon: PenTool },
    ]
  },
  {
    name: 'Layout',
    blocks: [
        { id: '2col', label: '2 Columns', icon: ColumnsIcon },
        { id: '3col', label: '3 Columns', icon: LayoutGrid },
        { id: 'left-sidebar', label: 'Sidebar Left', icon: PanelLeft },
        { id: 'right-sidebar', label: 'Sidebar Right', icon: PanelRight },
    ]
  },
];

function InsertToolbar({ editor }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showTurnInto, setShowTurnInto] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
        setShowTurnInto(false);
      }
    };

    if (isOpen || showTurnInto) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (!editor) return null;

  const insertBlock = (blockId) => {
    switch (blockId) {
      // Text blocks
      case 'paragraph':
        editor.chain().focus().setParagraph().run();
        break;
      case 'h1':
        editor.chain().focus().toggleHeading({ level: 1 }).run();
        break;
      case 'h2':
        editor.chain().focus().toggleHeading({ level: 2 }).run();
        break;
      case 'h3':
        editor.chain().focus().toggleHeading({ level: 3 }).run();
        break;

      // Lists
      case 'bullet':
        editor.chain().focus().toggleBulletList().run();
        break;
      case 'numbered':
        editor.chain().focus().toggleOrderedList().run();
        break;
      case 'task':
        editor.chain().focus().toggleTaskList().run();
        break;

      // Blocks
      case 'quote':
        editor.chain().focus().toggleBlockquote().run();
        break;
      case 'code':
        editor.chain().focus().setCodeBlock({ language: 'javascript' }).run();
        break;
      case 'divider':
        editor.chain().focus().setHorizontalRule().run();
        break;
      case 'toggle':
        editor.chain().focus().setToggle().run();
        break;
      case 'card':
        editor.chain().focus().setCard().run();
        break;

      // Callouts
      case 'callout-info':
        editor.chain().focus().setCallout({ type: 'info' }).run();
        break;
      case 'callout-success':
        editor.chain().focus().setCallout({ type: 'success' }).run();
        break;
      case 'callout-warning':
        editor.chain().focus().setCallout({ type: 'warning' }).run();
        break;
      case 'callout-danger':
        editor.chain().focus().setCallout({ type: 'danger' }).run();
        break;

      // Media
      case 'image':
        editor.chain().focus().triggerImageUpload().run();
        break;
      case 'youtube': {
        const url = window.prompt('Enter YouTube URL:');
        if (url) {
          editor.chain().focus().setYoutubeVideo({ src: url }).run();
        }
        break;
      }
      case 'flowchart':
        editor.chain().focus().setExcalidraw().run();
        break;
      case '2col':
        editor.chain().focus().setColumns({ layout: 'two-columns' }).run();
        break;
      case '3col':
        editor.chain().focus().setColumns({ layout: 'three-columns' }).run();
        break;
      case 'left-sidebar':
        editor.chain().focus().setColumns({ layout: 'sidebar-left' }).run();
        break;
      case 'right-sidebar':
        editor.chain().focus().setColumns({ layout: 'sidebar-right' }).run();
        break;
      case 'table':
        setShowTableModal(true);
        break;

      default:
        console.warn('Unknown block type:', blockId);
    }

    setIsOpen(false);
  };

  // Turn Into: detect current block type
  const getCurrentBlockLabel = () => {
    if (editor.isActive('heading', { level: 1 })) return 'Heading 1';
    if (editor.isActive('heading', { level: 2 })) return 'Heading 2';
    if (editor.isActive('heading', { level: 3 })) return 'Heading 3';
    if (editor.isActive('bulletList')) return 'Bullet List';
    if (editor.isActive('orderedList')) return 'Numbered List';
    if (editor.isActive('taskList')) return 'Task List';
    if (editor.isActive('blockquote')) return 'Quote';
    if (editor.isActive('codeBlock')) return 'Code Block';
    return 'Paragraph';
  };

  const TURN_INTO_OPTIONS = [
    { id: 'paragraph', label: 'Paragraph', icon: Type, action: () => editor.chain().focus().setParagraph().run() },
    { id: 'h1', label: 'Heading 1', icon: Heading1, action: () => editor.chain().focus().toggleHeading({ level: 1 }).run() },
    { id: 'h2', label: 'Heading 2', icon: Heading2, action: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { id: 'h3', label: 'Heading 3', icon: Heading3, action: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
    { id: 'bullet', label: 'Bullet List', icon: List, action: () => editor.chain().focus().toggleBulletList().run() },
    { id: 'numbered', label: 'Numbered List', icon: ListOrdered, action: () => editor.chain().focus().toggleOrderedList().run() },
    { id: 'task', label: 'Task List', icon: CheckSquare, action: () => editor.chain().focus().toggleTaskList().run() },
    { id: 'quote', label: 'Quote', icon: Quote, action: () => editor.chain().focus().toggleBlockquote().run() },
    { id: 'code', label: 'Code Block', icon: Code, action: () => editor.chain().focus().toggleCodeBlock().run() },
  ];

  return (
    <div className="insert-toolbar flex items-center gap-1" ref={dropdownRef}>
      {/* Undo / Redo */}
      <button
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        title="Undo (Ctrl+Z)"
      >
        <Undo2 size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        title="Redo (Ctrl+Shift+Z)"
      >
        <Redo2 size={16} />
      </button>

      <div className="w-px h-5 bg-[var(--color-border-secondary)] mx-1" />

      {/* Insert Block Button */}
      <button
        onClick={() => { setIsOpen(!isOpen); setShowTurnInto(false); }}
        className={`
          flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
          transition-all duration-150
          ${isOpen
            ? 'bg-[var(--color-accent)] text-white'
            : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]'
          }
        `}
      >
        <Plus size={16} />
        <span>Insert</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Turn Into Button */}
      <div className="relative">
        <button
          onClick={() => { setShowTurnInto(!showTurnInto); setIsOpen(false); }}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
            transition-all duration-150
            ${showTurnInto
              ? 'bg-[var(--color-accent)] text-white'
              : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]'
            }
          `}
        >
          <ArrowRightLeft size={14} />
          <span>{getCurrentBlockLabel()}</span>
          <ChevronDown size={14} className={`transition-transform ${showTurnInto ? 'rotate-180' : ''}`} />
        </button>

        {showTurnInto && (
          <div className="absolute top-full left-0 mt-2 w-56 bg-[var(--color-bg-elevated)] border border-[var(--color-border-primary)] rounded-xl shadow-xl z-50 overflow-hidden py-1">
            <div className="px-3 py-1.5">
              <span className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Turn into</span>
            </div>
            {TURN_INTO_OPTIONS.map((opt) => {
              const isActive = getCurrentBlockLabel() === opt.label;
              return (
                <button
                  key={opt.id}
                  onClick={() => { opt.action(); setShowTurnInto(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-[var(--color-bg-hover)] transition-colors text-left ${
                    isActive ? 'bg-[var(--color-accent-light)]' : ''
                  }`}
                >
                  <opt.icon size={16} className={isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'} />
                  <span className={`text-sm ${isActive ? 'text-[var(--color-accent)] font-medium' : 'text-[var(--color-text-primary)]'}`}>
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Insert Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-[var(--color-bg-elevated)] border border-[var(--color-border-primary)] rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-150">
          <div className="max-h-[400px] overflow-y-auto py-2">
            {BLOCK_CATEGORIES.map((category, catIndex) => (
              <div key={category.name}>
                {catIndex > 0 && (
                  <div className="h-px bg-[var(--color-border-secondary)] my-1 mx-3" />
                )}
                <div className="px-3 py-1.5">
                  <span className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                    {category.name}
                  </span>
                </div>
                {category.blocks.map((block) => (
                  <button
                    key={block.id}
                    onClick={() => insertBlock(block.id)}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[var(--color-bg-hover)] transition-colors text-left group"
                  >
                    <div className={`w-8 h-8 rounded-lg bg-[var(--color-bg-tertiary)] flex items-center justify-center group-hover:bg-[var(--color-accent)]/10 transition-colors ${block.color || ''}`}>
                      <block.icon size={16} className={block.color || 'text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)]'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-[var(--color-text-primary)]">{block.label}</span>
                      {block.shortcut && (
                        <span className="ml-2 text-[10px] text-[var(--color-text-muted)]">{block.shortcut}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Table Creation Modal */}
      <TableCreationModal
        isOpen={showTableModal}
        onClose={() => setShowTableModal(false)}
        onInsert={(options) => {
          editor.chain().focus().insertTable({
            rows: options.rows,
            cols: options.cols,
            withHeaderRow: options.withHeaderRow,
          }).run();
          setShowTableModal(false);
        }}
      />
    </div>
  );
}

export default InsertToolbar;
