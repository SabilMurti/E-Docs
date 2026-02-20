/**
 * Table Bubble Menu - Static floating toolbar for table operations
 * Appears as a popup above the table when table is selected
 */

import { BubbleMenu } from '@tiptap/react';
import { useCallback, useState, useRef, useEffect } from 'react';
import {
  Table,
  Trash2,
  Plus,
  Merge,
  Split,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ChevronDown,
  X,
} from 'lucide-react';
import './table-styles.css';

const TABLE_COLORS = [
  { color: '', name: 'None' },
  { color: '#fef2f2', name: 'Red' },
  { color: '#fff7ed', name: 'Orange' },
  { color: '#fefce8', name: 'Yellow' },
  { color: '#f7fee7', name: 'Lime' },
  { color: '#f0fdf4', name: 'Green' },
  { color: '#ecfdf5', name: 'Emerald' },
  { color: '#f0f9ff', name: 'Sky' },
  { color: '#eff6ff', name: 'Blue' },
  { color: '#eef2ff', name: 'Indigo' },
  { color: '#faf5ff', name: 'Purple' },
  { color: '#fdf4ff', name: 'Pink' },
  { color: '#f8fafc', name: 'Slate' },
  { color: '#f9fafb', name: 'Gray' },
];

export function TableBubbleMenu({ editor }) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const menuRef = useRef(null);

  const addColumnBefore = useCallback(() => {
    editor.chain().focus().addColumnBefore().run();
  }, [editor]);

  const addColumnAfter = useCallback(() => {
    editor.chain().focus().addColumnAfter().run();
  }, [editor]);

  const deleteColumn = useCallback(() => {
    editor.chain().focus().deleteColumn().run();
  }, [editor]);

  const addRowBefore = useCallback(() => {
    editor.chain().focus().addRowBefore().run();
  }, [editor]);

  const addRowAfter = useCallback(() => {
    editor.chain().focus().addRowAfter().run();
  }, [editor]);

  const deleteRow = useCallback(() => {
    editor.chain().focus().deleteRow().run();
  }, [editor]);

  const mergeCells = useCallback(() => {
    editor.chain().focus().mergeCells().run();
  }, [editor]);

  const splitCell = useCallback(() => {
    editor.chain().focus().splitCell().run();
  }, [editor]);

  const deleteTable = useCallback(() => {
    editor.chain().focus().deleteTable().run();
  }, [editor]);

  const setCellAlignment = useCallback((align) => {
    editor.chain().focus().setTextAlign(align).run();
  }, [editor]);

  const setCellBackgroundColor = useCallback((color) => {
    editor.chain().focus().setCellAttribute('backgroundColor', color).run();
    setShowColorPicker(false);
  }, [editor]);

  const canMergeCells = editor.can().mergeCells();
  const canSplitCell = editor.can().splitCell();

  // Close color picker when clicking outside
  useEffect(() => {
    if (!showColorPicker) return;

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowColorPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showColorPicker]);

  return (
    <BubbleMenu
      editor={editor}
      pluginKey="tableBubbleMenu"
      shouldShow={({ editor }) => {
        // Only show when table is active AND editor is focused
        return editor.isEditable && editor.isActive('table');
      }}
      tippyOptions={{
        duration: 100,
        placement: 'top',
        offset: [0, 10],
        maxWidth: '100%',
        popperOptions: {
          modifiers: [
            {
              name: 'preventOverflow',
              options: {
                boundary: 'viewport',
                altAxis: true,
              },
            },
            {
              name: 'flip',
              options: {
                fallbackPlacements: ['bottom', 'top-start', 'bottom-start'],
              },
            },
          ],
        },
      }}
      className="table-bubble-menu-wrapper"
    >
      <div ref={menuRef} className="table-bubble-menu">
        <div className="table-bubble-menu-content">
          {/* Column Operations */}
          <div className="menu-group">
            <button
              onClick={addColumnBefore}
              className="menu-btn"
              title="Add column before"
              type="button"
            >
              <Plus size={14} />
              <span>Col Left</span>
            </button>
            <button
              onClick={addColumnAfter}
              className="menu-btn"
              title="Add column after"
              type="button"
            >
              <Plus size={14} />
              <span>Col Right</span>
            </button>
            <button
              onClick={deleteColumn}
              className="menu-btn menu-btn-danger"
              title="Delete column"
              type="button"
            >
              <Trash2 size={14} />
              <span>Col</span>
            </button>
          </div>

          <div className="menu-divider" />

          {/* Row Operations */}
          <div className="menu-group">
            <button
              onClick={addRowBefore}
              className="menu-btn"
              title="Add row before"
              type="button"
            >
              <Plus size={14} />
              <span>Row Up</span>
            </button>
            <button
              onClick={addRowAfter}
              className="menu-btn"
              title="Add row after"
              type="button"
            >
              <Plus size={14} />
              <span>Row Down</span>
            </button>
            <button
              onClick={deleteRow}
              className="menu-btn menu-btn-danger"
              title="Delete row"
              type="button"
            >
              <Trash2 size={14} />
              <span>Row</span>
            </button>
          </div>

          <div className="menu-divider" />

          {/* Cell Operations */}
          <div className="menu-group">
            <button
              onClick={mergeCells}
              className="menu-btn"
              disabled={!canMergeCells}
              title="Merge cells"
              type="button"
            >
              <Merge size={14} />
            </button>
            <button
              onClick={splitCell}
              className="menu-btn"
              disabled={!canSplitCell}
              title="Split cell"
              type="button"
            >
              <Split size={14} />
            </button>
          </div>

          <div className="menu-divider" />

          {/* Alignment */}
          <div className="menu-group">
            <button
              onClick={() => setCellAlignment('left')}
              className={`menu-btn ${editor.isActive({ textAlign: 'left' }) ? 'menu-btn-active' : ''}`}
              title="Align left"
              type="button"
            >
              <AlignLeft size={14} />
            </button>
            <button
              onClick={() => setCellAlignment('center')}
              className={`menu-btn ${editor.isActive({ textAlign: 'center' }) ? 'menu-btn-active' : ''}`}
              title="Align center"
              type="button"
            >
              <AlignCenter size={14} />
            </button>
            <button
              onClick={() => setCellAlignment('right')}
              className={`menu-btn ${editor.isActive({ textAlign: 'right' }) ? 'menu-btn-active' : ''}`}
              title="Align right"
              type="button"
            >
              <AlignRight size={14} />
            </button>
          </div>

          <div className="menu-divider" />

          {/* Background Color */}
          <div className="menu-group relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className={`menu-btn ${showColorPicker ? 'menu-btn-active' : ''}`}
              title="Cell background color"
              type="button"
            >
              <Palette size={14} />
              <span>Color</span>
              <ChevronDown size={12} />
            </button>

            {showColorPicker && (
              <div className="color-picker-dropdown">
                <div className="color-picker-header">
                  <span>Background</span>
                  <button
                    onClick={() => setShowColorPicker(false)}
                    className="color-picker-close"
                    type="button"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="color-grid">
                  {TABLE_COLORS.map((c) => (
                    <button
                      key={c.color || 'none'}
                      onClick={() => setCellBackgroundColor(c.color)}
                      className="color-swatch"
                      style={{ backgroundColor: c.color || 'transparent' }}
                      title={c.name}
                      type="button"
                    >
                      {c.color === '' && <span className="color-swatch-x">✕</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="menu-divider" />

          {/* Delete Table */}
          <div className="menu-group">
            <button
              onClick={deleteTable}
              className="menu-btn menu-btn-danger"
              title="Delete entire table"
              type="button"
            >
              <Table size={14} />
              <span>Delete Table</span>
            </button>
          </div>
        </div>
      </div>
    </BubbleMenu>
  );
}

export default TableBubbleMenu;
