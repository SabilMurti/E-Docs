/**
 * TablePlus Extension for Tiptap
 * 
 * Enhanced table with:
 * - Creation modal with size picker
 * - Table toolbar with operations
 * - Style options (bordered, striped, header styles)
 * - Cell merging
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus,
  Minus,
  Trash2,
  Rows3,
  Columns3,
  Merge,
  Split,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  Settings2,
  GripVertical,
  X,
  Check,
  Grid3X3,
  PaintBucket,
} from 'lucide-react';

// Table styles configuration
const TABLE_STYLES = {
  default: {
    name: 'Default',
    headerBg: 'bg-[var(--color-bg-tertiary)]',
    headerText: 'text-[var(--color-text-primary)] font-semibold',
    cellBg: 'bg-transparent',
    border: 'border-[var(--color-border-primary)]',
    stripe: false,
  },
  bordered: {
    name: 'Bordered',
    headerBg: 'bg-[var(--color-bg-secondary)]',
    headerText: 'text-[var(--color-text-primary)] font-semibold',
    cellBg: 'bg-transparent',
    border: 'border-[var(--color-border-primary)] border-2',
    stripe: false,
  },
  striped: {
    name: 'Striped',
    headerBg: 'bg-[var(--color-accent)]/10',
    headerText: 'text-[var(--color-accent)] font-semibold',
    cellBg: 'bg-transparent even:bg-[var(--color-bg-secondary)]',
    border: 'border-[var(--color-border-secondary)]',
    stripe: true,
  },
  minimal: {
    name: 'Minimal',
    headerBg: 'bg-transparent border-b-2 border-[var(--color-border-primary)]',
    headerText: 'text-[var(--color-text-primary)] font-semibold',
    cellBg: 'bg-transparent',
    border: 'border-b border-[var(--color-border-secondary)]',
    stripe: false,
  },
};

/**
 * Table Creation Modal
 */
export function TableCreationModal({ isOpen, onClose, onInsert }) {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [withHeader, setWithHeader] = useState(true);
  const [style, setStyle] = useState('default');
  const [hoverCell, setHoverCell] = useState({ row: 0, col: 0 });
  
  const handleGridClick = (row, col) => {
    setRows(row + 1);
    setCols(col + 1);
  };
  
  const handleInsert = () => {
    onInsert({
      rows,
      cols,
      withHeaderRow: withHeader,
      style,
    });
    onClose();
    // Reset for next time
    setRows(3);
    setCols(3);
  };
  
  if (!isOpen) return null;
  
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-[var(--color-bg-elevated)] border border-[var(--color-border-primary)] rounded-xl shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-primary)]">
          <div className="flex items-center gap-2">
            <Grid3X3 size={18} className="text-[var(--color-accent)]" />
            <h3 className="font-semibold text-[var(--color-text-primary)]">Insert Table</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)]"
          >
            <X size={16} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Grid Picker */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              Size: {cols} × {rows}
            </label>
            <div className="inline-grid gap-1 p-2 bg-[var(--color-bg-secondary)] rounded-lg">
              {Array.from({ length: 8 }).map((_, rowIndex) => (
                <div key={rowIndex} className="flex gap-1">
                  {Array.from({ length: 8 }).map((_, colIndex) => (
                    <button
                      key={colIndex}
                      onMouseEnter={() => setHoverCell({ row: rowIndex, col: colIndex })}
                      onClick={() => handleGridClick(rowIndex, colIndex)}
                      className={`
                        w-5 h-5 rounded-sm border transition-colors
                        ${(rowIndex <= hoverCell.row && colIndex <= hoverCell.col) ||
                          (rowIndex < rows && colIndex < cols)
                          ? 'bg-[var(--color-accent)] border-[var(--color-accent)]'
                          : 'bg-[var(--color-bg-tertiary)] border-[var(--color-border-secondary)] hover:border-[var(--color-accent)]'
                        }
                      `}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
          
          {/* Manual Size Input */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs text-[var(--color-text-muted)] mb-1">Columns</label>
              <input
                type="number"
                min={1}
                max={20}
                value={cols}
                onChange={(e) => setCols(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)]"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-[var(--color-text-muted)] mb-1">Rows</label>
              <input
                type="number"
                min={1}
                max={50}
                value={rows}
                onChange={(e) => setRows(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)]"
              />
            </div>
          </div>
          
          {/* Options */}
          <div className="space-y-3">
            {/* Header Row Toggle */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={withHeader}
                onChange={(e) => setWithHeader(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--color-border-primary)] text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
              />
              <span className="text-sm text-[var(--color-text-secondary)]">Include header row</span>
            </label>
            
            {/* Style Picker */}
            <div>
              <label className="block text-xs text-[var(--color-text-muted)] mb-2">Table Style</label>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(TABLE_STYLES).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => setStyle(key)}
                    className={`
                      px-3 py-2 rounded-lg text-xs font-medium transition-colors
                      ${style === key
                        ? 'bg-[var(--color-accent)] text-white'
                        : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                      }
                    `}
                  >
                    {cfg.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex gap-3 px-4 py-3 border-t border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)]">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-[var(--color-border-primary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleInsert}
            className="flex-1 px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            <Check size={16} />
            Insert Table
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/**
 * Table Toolbar - appears when table is selected
 */
export function TableToolbar({ editor }) {
  if (!editor || !editor.isActive('table')) return null;

  const [showColors, setShowColors] = useState(false);
  const [showStyles, setShowStyles] = useState(false);
  const colorRef = useRef(null);
  const styleRef = useRef(null);

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (colorRef.current && !colorRef.current.contains(event.target)) setShowColors(false);
      if (styleRef.current && !styleRef.current.contains(event.target)) setShowStyles(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const buttonClass = `
    flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium
    text-[var(--color-text-secondary)] 
    hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]
    transition-colors disabled:opacity-50 disabled:cursor-not-allowed
  `;
  
  const iconButtonClass = `
    p-2 rounded-md text-[var(--color-text-secondary)] 
    hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]
    transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative
  `;
  
  const dividerClass = "w-px h-6 bg-[var(--color-border-secondary)] mx-1";

  const COLORS = [
    { label: 'None', value: null },
    { label: 'Gray', value: 'var(--color-bg-secondary)' },
    { label: 'Red', value: '#fee2e2' },
    { label: 'Green', value: '#dcfce7' },
    { label: 'Blue', value: '#dbeafe' },
    { label: 'Yellow', value: '#fef3c7' },
    { label: 'Purple', value: '#f3e8ff' },
  ];
  
  return (
    <div className="table-toolbar flex items-center gap-1 p-1.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-primary)] rounded-xl shadow-lg animate-in fade-in slide-in-from-top-1 duration-200">
      {/* Row Operations */}
      <button onClick={() => editor.chain().focus().addRowBefore().run()} className={buttonClass} title="Add row above">
        <Plus size={14} /><span>Row ↑</span>
      </button>
      <button onClick={() => editor.chain().focus().addRowAfter().run()} className={buttonClass} title="Add row below">
        <Plus size={14} /><span>Row ↓</span>
      </button>
      <button onClick={() => editor.chain().focus().deleteRow().run()} className={`${buttonClass} hover:text-red-500`} title="Delete row">
        <Trash2 size={14} />
      </button>
      
      <div className={dividerClass} />
      
      {/* Column Operations */}
      <button onClick={() => editor.chain().focus().addColumnBefore().run()} className={buttonClass} title="Add column left">
        <Plus size={14} /><span>Col ←</span>
      </button>
      <button onClick={() => editor.chain().focus().addColumnAfter().run()} className={buttonClass} title="Add column right">
        <Plus size={14} /><span>Col →</span>
      </button>
      <button onClick={() => editor.chain().focus().deleteColumn().run()} className={`${buttonClass} hover:text-red-500`} title="Delete column">
        <Trash2 size={14} />
      </button>
      
      <div className={dividerClass} />
      
      {/* Cell Operations */}
      <button onClick={() => editor.chain().focus().mergeCells().run()} disabled={!editor.can().mergeCells()} className={iconButtonClass} title="Merge cells">
        <Merge size={16} />
      </button>
      <button onClick={() => editor.chain().focus().splitCell().run()} disabled={!editor.can().splitCell()} className={iconButtonClass} title="Split cell">
        <Split size={16} />
      </button>

      {/* Background Color Picker */}
      <div className="relative" ref={colorRef}>
        <button 
          onClick={() => { setShowColors(!showColors); setShowStyles(false); }} 
          className={iconButtonClass} 
          title="Cell Background"
        >
          <PaintBucket size={16} />
        </button>
        {showColors && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 p-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-primary)] rounded-lg shadow-xl grid grid-cols-4 gap-1 min-w-[120px] z-50">
            {COLORS.map((c) => (
              <button
                key={c.label}
                onClick={() => {
                  editor.chain().focus().setCellAttribute('backgroundColor', c.value).run();
                  setShowColors(false);
                }}
                className="w-6 h-6 rounded border border-[var(--color-border-secondary)] hover:scale-110 transition-transform"
                style={{ backgroundColor: c.value || 'transparent' }}
                title={c.label}
              >
                {!c.value && <X size={12} className="mx-auto text-[var(--color-text-muted)]" />}
              </button>
            ))}
          </div>
        )}
      </div>
      
      <div className={dividerClass} />
      
      {/* Headers */}
      <button onClick={() => editor.chain().focus().toggleHeaderRow().run()} className={iconButtonClass} title="Toggle Header Row">
        <Rows3 size={16} className={editor.getError ? '' : 'text-[var(--color-accent)]'} />
      </button>
      <button onClick={() => editor.chain().focus().toggleHeaderColumn().run()} className={iconButtonClass} title="Toggle Header Column">
        <Columns3 size={16} />
      </button>

      {/* Style Picker */}
      <div className="relative" ref={styleRef}>
         <button 
            onClick={() => { setShowStyles(!showStyles); setShowColors(false); }} 
            className={iconButtonClass}
            title="Table Style"
         >
            <Palette size={16} />
         </button>
         {showStyles && (
            <div className="absolute top-full right-0 mt-2 p-1 bg-[var(--color-bg-elevated)] border border-[var(--color-border-primary)] rounded-lg shadow-xl min-w-[140px] z-50 flex flex-col gap-1">
              {Object.entries(TABLE_STYLES).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => {
                    editor.chain().focus().updateAttributes('table', { style: key }).run();
                    setShowStyles(false);
                  }}
                  className="px-3 py-1.5 text-left text-xs hover:bg-[var(--color-bg-hover)] rounded"
                >
                  {cfg.name}
                </button>
              ))}
            </div>
         )}
      </div>
      
      <div className={dividerClass} />
      
      {/* Delete Table */}
      <button onClick={() => editor.chain().focus().deleteTable().run()} className={`${iconButtonClass} hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20`} title="Delete table">
        <Trash2 size={16} />
      </button>
    </div>
  );
}

/**
 * Hook to manage table creation modal
 */
export function useTableCreation(editor) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const openModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);
  
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);
  
  const insertTable = useCallback((options) => {
    if (!editor) return;
    
    editor.chain().focus().insertTable({
      rows: options.rows,
      cols: options.cols,
      withHeaderRow: options.withHeaderRow,
    }).updateAttributes('table', { style: options.style }).run();
  }, [editor]);
  
  return {
    isModalOpen,
    openModal,
    closeModal,
    insertTable,
    TableModal: () => (
      <TableCreationModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onInsert={insertTable}
      />
    ),
  };
}

export default TableToolbar;
