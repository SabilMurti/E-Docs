import {
  Bold, Italic, Strikethrough, Code, List, ListOrdered, Quote, Minus, Undo, Redo,
  Heading1, Heading2, Heading3, CheckSquare, Table, Image as ImageIcon,
  Highlighter, Link, AlignLeft, AlignCenter, AlignRight, Underline
} from 'lucide-react';
import { useCallback } from 'react';

function ToolbarButton({ onClick, isActive, disabled, children, title }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        p-2 rounded-lg transition-colors
        ${isActive 
          ? 'bg-[var(--color-accent-light)] text-[var(--color-accent)]' 
          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)]'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
      type="button"
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="w-px h-6 bg-[var(--color-border)] mx-1" />;
}

function EditorToolbar({ editor }) {
  if (!editor) return null;

  const addImage = useCallback(() => {
    const url = window.prompt('Image URL');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  return (
    <div className="
      sticky top-[calc(var(--navbar-height)+1px)] z-20
      flex items-center flex-wrap gap-0.5 p-2 mb-4
      bg-[var(--color-bg-secondary)]
      border border-[var(--color-border)]
      rounded-lg shadow-sm
    ">
      {/* Headings */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} title="Heading 1"><Heading1 size={18} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} title="Heading 2"><Heading2 size={18} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })} title="Heading 3"><Heading3 size={18} /></ToolbarButton>

      <ToolbarDivider />

      {/* Formatting */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Bold"><Bold size={18} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Italic"><Italic size={18} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} title="Underline"><Underline size={18} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} title="Strike"><Strikethrough size={18} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight().run()} isActive={editor.isActive('highlight')} title="Highlight"><Highlighter size={18} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} isActive={editor.isActive('code')} title="Code"><Code size={18} /></ToolbarButton>
      
      <ToolbarDivider />

      {/* Alignment */}
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} title="Align Left"><AlignLeft size={18} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} title="Align Center"><AlignCenter size={18} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} title="Align Right"><AlignRight size={18} /></ToolbarButton>

      <ToolbarDivider />

      {/* Lists */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="Bullet List"><List size={18} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="Ordered List"><ListOrdered size={18} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleTaskList().run()} isActive={editor.isActive('taskList')} title="Check List"><CheckSquare size={18} /></ToolbarButton>

      <ToolbarDivider />

      {/* Inserts */}
      <ToolbarButton onClick={setLink} isActive={editor.isActive('link')} title="Link"><Link size={18} /></ToolbarButton>
      <ToolbarButton onClick={addImage} title="Image"><ImageIcon size={18} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Table"><Table size={18} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} title="Quote"><Quote size={18} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider"><Minus size={18} /></ToolbarButton>

      <ToolbarDivider />

      {/* History */}
      <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo"><Undo size={18} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo"><Redo size={18} /></ToolbarButton>
    </div>
  );
}

export default EditorToolbar;
