import { useEffect, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';

// TipTap Extensions
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import Youtube from '@tiptap/extension-youtube';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import CharacterCount from '@tiptap/extension-character-count';
import Typography from '@tiptap/extension-typography';

// Custom Extensions
import { SmartNestedList } from './extensions/SmartNestedList';
import { CustomCodeBlock } from './extensions/CustomCodeBlock';

// Components
import SlashCommandMenu from './SlashCommandMenu';
import BlockHandle from './BlockHandle';
import BubbleToolbar from './BubbleToolbar';

/**
 * PageEditor - GitBook-style editor component
 * 
 * @param {Object} content - Initial content (TipTap JSON)
 * @param {Function} onChange - Callback when content changes
 * @param {boolean} editable - Whether editor is editable
 */
export default function PageEditor({ 
  content, 
  onChange, 
  editable = true 
}) {
  const [slashMenuState, setSlashMenuState] = useState({ 
    visible: false, 
    query: '', 
    top: 0, 
    left: 0,
    selectedIndex: 0 // Lifted state
  });
  const wrapperRef = useRef(null);

  // Initialize TipTap editor
  const editor = useEditor({
    editable,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        dropcursor: { 
          color: 'var(--color-accent)', 
          width: 2 
        },
        // Disable default CodeBlock to use our custom one
        codeBlock: false,
        // Enable proper list nesting
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
        listItem: {
          // Allow any content inside list items for nesting (e.g. other lists)
          HTMLAttributes: {
            class: 'list-item-base',
          },
        },
      }),
      SmartNestedList,
      CustomCodeBlock,
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') {
            return `Heading ${node.attrs.level}`;
          }
          if (node.type.name === 'codeBlock') {
            return '';
          }
          // Only show 'Type /' on empty paragraphs, including inside lists
          return 'Type / for commands';
        },
        includeChildren: true, 
        showOnlyCurrent: true,
      }),
      Image.configure({ 
        inline: true, 
        allowBase64: true 
      }),
      Link.configure({ 
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-[color:var(--color-accent)] underline hover:opacity-80',
        },
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: 'task-list',
        },
      }),
      TaskItem.configure({ 
        nested: true, // Crucial for nested task lists
        HTMLAttributes: {
          class: 'task-item',
        },
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Highlight.configure({ multicolor: true }),
      Underline,
      Youtube.configure({ 
        width: 640, 
        height: 480,
        nocookie: true 
      }),
      Subscript,
      Superscript,
      TextAlign.configure({ 
        types: ['heading', 'paragraph'] 
      }),
      TextStyle,
      Color,
      CharacterCount.configure({ limit: null }),
      Typography,
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[500px] pl-12 pr-4 py-4',
      },
      handleKeyDown: (view, event) => {
        // Only handle if slash menu is visible
        if (!slashMenuState.visible) return false;

        if (event.key === 'ArrowUp') {
          event.preventDefault();
          setSlashMenuState(prev => ({ ...prev, selectedIndex: prev.selectedIndex - 1 }));
          return true;
        }

        if (event.key === 'ArrowDown') {
          event.preventDefault();
          setSlashMenuState(prev => ({ ...prev, selectedIndex: prev.selectedIndex + 1 }));
          return true;
        }

        if (event.key === 'Enter') {
          event.preventDefault();
          // We trigger a custom event or callback that SlashCommandMenu listens to
          // Or simpler: pass a "enterPressed" timestamp to force effect in child
          setSlashMenuState(prev => ({ ...prev, enterPressed: Date.now() }));
          return true;
        }

        if (event.key === 'Escape') {
          event.preventDefault();
          setSlashMenuState(prev => ({ ...prev, visible: false }));
          return true;
        }

        return false;
      }
    },
  });

  // Update selectedIndex calculation in SlashCommandMenu isn't enough, we need to handle wrapping there or here.
  // Actually, calculating wrapping here is hard because we don't know filteredBlocks length easily.
  // Better approach: Let SlashCommandMenu handle navigation BUT via a ref exposed to parent? 
  // OR: Just let SlashCommandMenu handle document keydown but use capture phase?
  // THE ISSUE: existing code in SlashCommandMenu uses document.addEventListener which might be too late or early.
  // BUT TipTap captures Enter.
  
  // Revised approach inside this replace: 
  // We keep the handleKeyDown here to prevent TipTap default behavior.
  // We pass the event to SlashCommandMenu via props/state.

  // Slash Command Detection
  useEffect(() => {
    if (!editor) return;

    const handleTransaction = () => {
      const { selection } = editor.state;
      const { $from } = selection;

      // Only trigger on empty selection
      if (!selection.empty) {
        if (slashMenuState.visible) {
          setSlashMenuState(prev => ({ ...prev, visible: false }));
        }
        return;
      }

      const nodeText = $from.parent.textContent;
      const textBefore = nodeText.slice(0, $from.parentOffset);

      // Match slash command pattern
      const match = textBefore.match(/(?:^|\s)\/([a-zA-Z0-9]*)$/);

      if (match) {
        const query = match[1];
        const matchIndex = textBefore.lastIndexOf(match[0]);
        const slashOffset = match[0].indexOf('/');
        const absoluteIndex = matchIndex + slashOffset;
        const startPos = $from.pos - (textBefore.length - absoluteIndex);
        
        // Use Native Browser Selection for accurate coordinates
        // This prevents menu from appearing at 0,0 (left sidebar) if Tiptap fails
        let top = 0;
        let left = 0;
        
        const container = wrapperRef.current || editor.view.dom;
        const containerRect = container.getBoundingClientRect();
        
        const domSelection = window.getSelection();
        if (domSelection && domSelection.rangeCount > 0) {
          const range = domSelection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          
          // Calculate relative position to container
          top = rect.bottom - containerRect.top + container.scrollTop + 4;
          left = rect.left - containerRect.left;
        } else {
           // Fallback
           const coords = editor.view.coordsAtPos(startPos);
           top = coords.bottom - containerRect.top + container.scrollTop + 4;
           left = coords.left - containerRect.left;
        }

        setSlashMenuState(prev => {
           // Reset index if query changed significantly or opened new
           if (!prev.visible || prev.query !== query) {
             return {
               visible: true,
               query,
               top,
               left,
               selectedIndex: 0,
               enterPressed: null,
               navigationEvent: null 
             };
           }
           return {
             ...prev,
             visible: true,
             query,
             top,
             left,
           };
        });
      } else {
        if (slashMenuState.visible) {
          setSlashMenuState(prev => ({ ...prev, visible: false }));
        }
      }
    };

    editor.on('transaction', handleTransaction);
    return () => editor.off('transaction', handleTransaction);
  }, [editor, slashMenuState.visible]); // Removed dependency on slashMenuState.query to avoid loops

  // Close slash menu on click outside
  useEffect(() => {
    if (!slashMenuState.visible) return;

    const handleClick = (e) => {
      if (!e.target.closest('.editor-menu')) {
        setSlashMenuState(prev => ({ ...prev, visible: false }));
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [slashMenuState.visible]);

  if (!editor) return null;

  return (
    <div 
      ref={wrapperRef} 
      className="page-editor relative group"
    >
      {/* Bubble Menu (text selection toolbar) */}
      {editable && <BubbleToolbar editor={editor} />}

      {/* Side Handle (+ and grip buttons) */}
      {editable && (
        <BlockHandle 
          editor={editor} 
          containerRef={wrapperRef} 
        />
      )}

      {/* Slash Command Menu */}
      {editable && slashMenuState.visible && (
        <SlashCommandMenu
          editor={editor}
          query={slashMenuState.query}
          position={{ 
            top: slashMenuState.top, 
            left: slashMenuState.left 
          }}
          onClose={() => setSlashMenuState(prev => ({ ...prev, visible: false }))}
          // Pass navigation state
          selectedIndex={slashMenuState.selectedIndex}
          enterPressed={slashMenuState.enterPressed}
          navigationEvent={slashMenuState.navigationEvent}
        />
      )}

      {/* Editor Content */}
      <EditorContent editor={editor} />
    </div>
  );
}
