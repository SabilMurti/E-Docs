import { BubbleMenu } from '@tiptap/react';
import { 
  Bold, Italic, Strikethrough, Link, Code, Highlighter,
  AlignLeft, AlignCenter, AlignRight
} from 'lucide-react';
import { useState, useCallback } from 'react';

function MenuButton({ onClick, isActive, children, label }) {
  return (
    <button
      onClick={onClick}
      className={`
        p-1.5 rounded hover:bg-gray-100 text-gray-600
        ${isActive ? 'text-blue-600 bg-blue-50' : ''}
      `}
      title={label}
      type="button"
    >
      {children}
    </button>
  );
}

function EditorBubbleMenu({ editor }) {
  if (!editor) return null;

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // update
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  return (
    <BubbleMenu 
      editor={editor} 
      tippyOptions={{ duration: 100 }}
      className="flex items-center gap-1 p-1 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
    >
      <MenuButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        label="Bold"
      >
        <Bold size={16} />
      </MenuButton>

      <MenuButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        label="Italic"
      >
        <Italic size={16} />
      </MenuButton>

      <MenuButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        label="Strike"
      >
        <Strikethrough size={16} />
      </MenuButton>
      
      <MenuButton
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        isActive={editor.isActive('highlight')}
        label="Highlight"
      >
        <Highlighter size={16} />
      </MenuButton>

      <div className="w-px h-4 bg-gray-200 mx-1" />

      <MenuButton
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        isActive={editor.isActive({ textAlign: 'left' })}
        label="Align Left"
      >
        <AlignLeft size={16} />
      </MenuButton>

      <MenuButton
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        isActive={editor.isActive({ textAlign: 'center' })}
        label="Align Center"
      >
        <AlignCenter size={16} />
      </MenuButton>

      <MenuButton
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        isActive={editor.isActive({ textAlign: 'right' })}
        label="Align Right"
      >
        <AlignRight size={16} />
      </MenuButton>

      <div className="w-px h-4 bg-gray-200 mx-1" />

      <MenuButton
        onClick={setLink}
        isActive={editor.isActive('link')}
        label="Link"
      >
        <Link size={16} />
      </MenuButton>
      
      <MenuButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive('code')}
        label="Code"
      >
        <Code size={16} />
      </MenuButton>
    </BubbleMenu>
  );
}

export default EditorBubbleMenu;
