/**
 * RichEditor - Main editor component
 * 
 * A clean, modular rich text editor with:
 * - Slash command menu
 * - Bubble toolbar
 * - Block handle with drag-drop
 * - Proper extension support
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';

import { getExtensions } from './extensions';

// UI Components
import SlashMenu from './menus/SlashMenu';
import BubbleToolbar from './BubbleToolbar';
import InsertToolbar from './InsertToolbar';
import { TableToolbar, useTableCreation } from './TablePlus';

/**
 * RichEditor Component
 * 
 * @param {Object} content - Initial content (TipTap JSON)
 * @param {Function} onChange - Callback when content changes
 * @param {boolean} editable - Whether editor is editable
 * @param {string} placeholder - Placeholder text
 */
export default function RichEditor({ 
  content, 
  onChange, 
  editable = true,
  placeholder = null 
}) {
  const wrapperRef = useRef(null);
  
  const [slashMenu, setSlashMenu] = useState({
    visible: false,
    query: '',
    position: { top: 0, left: 0 }
  });
  
  const extensions = useMemo(() => getExtensions(placeholder), [placeholder]);
  
  const editor = useEditor({
    extensions,
    content: content || '',
    editable,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class: 'rich-editor-content focus:outline-none min-h-[400px] pl-12 pr-4 py-4',
      },
    },
  });
  
  // Slash command detection - Standard Logic
  useEffect(() => {
    if (!editor) return;
    
    const handleTransaction = () => {
      const { selection } = editor.state;
      const { $from } = selection;
      
      if (!selection.empty) {
        if (slashMenu.visible) {
          setSlashMenu(prev => ({ ...prev, visible: false }));
        }
        return;
      }
      
      const textBefore = $from.parent.textContent.slice(0, $from.parentOffset);
      const match = textBefore.match(/(?:^|\s)\/([a-zA-Z0-9]*)$/);
      
      if (match) {
        const query = match[1];
        const matchIndex = textBefore.lastIndexOf(match[0]);
        const slashOffset = match[0].indexOf('/');
        const startPos = $from.pos - (textBefore.length - matchIndex - slashOffset);
        
        const coords = editor.view.coordsAtPos(startPos);
        
        setSlashMenu({
          visible: true,
          query,
          position: {
            top: coords.bottom + 4,
            left: coords.left
          }
        });
      } else {
        if (slashMenu.visible) {
          setSlashMenu(prev => ({ ...prev, visible: false }));
        }
      }
    };
    
    editor.on('transaction', handleTransaction);
    return () => editor.off('transaction', handleTransaction);
  }, [editor, slashMenu.visible]);
  
  useEffect(() => {
    if (!slashMenu.visible) return;
    
    const handleClick = (e) => {
      if (!e.target.closest('.slash-menu')) {
        setSlashMenu(prev => ({ ...prev, visible: false }));
      }
    };
    
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [slashMenu.visible]);
  
  useEffect(() => {
    if (editor && content) {
      const currentContent = editor.getJSON();
      if (JSON.stringify(currentContent) !== JSON.stringify(content)) {
        editor.commands.setContent(content);
      }
    }
  }, [content, editor]);
  
  if (!editor) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-6 h-6 border-2 border-[color:var(--color-accent)] border-t-transparent rounded-full" />
      </div>
    );
  }
  
  return (
    <div ref={wrapperRef} className="rich-editor relative group">
      {/* Toolbar */}
      {editable && (
        <div className="editor-toolbar sticky top-0 z-20 bg-[var(--color-bg-primary)] border-b border-[var(--color-border-secondary)] px-4 py-2 flex items-center gap-2">
          <InsertToolbar editor={editor} />
          <div className="ml-auto flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
            <span>Type <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-bg-tertiary)] text-[10px] font-mono">/</kbd> for commands</span>
          </div>
        </div>
      )}
      
      {/* Bubble Menu */}
      {editable && <BubbleToolbar editor={editor} />}
      
      {/* Table Toolbar */}
      {editable && editor?.isActive('table') && (
        <div className="table-toolbar-container sticky top-12 z-10 flex justify-center py-2">
          <TableToolbar editor={editor} />
        </div>
      )}

      {/* Main Content Area - Single Column, Centered */}
      <div className="max-w-4xl mx-auto w-full px-4 md:px-6">
         <div className="prose prose-invert max-w-none w-full pb-32">
            <EditorContent editor={editor} />
         </div>
      </div>
      
      {/* Slash Menu */}
      {editable && slashMenu.visible && (
        <SlashMenu
          editor={editor}
          query={slashMenu.query}
          position={slashMenu.position}
          onClose={() => setSlashMenu(prev => ({ ...prev, visible: false }))}
        />
      )}
    </div>
  );
}
