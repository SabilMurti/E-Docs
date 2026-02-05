  import { FloatingMenu } from '@tiptap/react';
import { 
  Heading1, Heading2, List, ListOrdered, CheckSquare, 
  Quote, Image as ImageIcon, Code, Table, Minus 
} from 'lucide-react';
import { useCallback } from 'react';

function MenuButton({ onClick, children, label }) {
  return (
    <button
      onClick={onClick}
      className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
      title={label}
      type="button"
    >
      {children}
    </button>
  );
}

function EditorFloatingMenu({ editor }) {
  if (!editor) return null;

  const addImage = useCallback(() => {
    const url = window.prompt('Image URL');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const addTable = useCallback(() => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  return (
    <FloatingMenu 
      editor={editor} 
      tippyOptions={{ duration: 100 }}
      className="flex items-center gap-1 p-1 bg-white rounded-lg shadow-lg border border-gray-200"
    >
      <MenuButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        label="Heading 1"
      >
        <Heading1 size={18} />
      </MenuButton>

      <MenuButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        label="Heading 2"
      >
        <Heading2 size={18} />
      </MenuButton>

      <div className="w-px h-4 bg-gray-200 mx-1" />

      <MenuButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        label="Bullet List"
      >
        <List size={18} />
      </MenuButton>

      <MenuButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        label="Numbered List"
      >
        <ListOrdered size={18} />
      </MenuButton>

      <MenuButton
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        label="Check List"
      >
        <CheckSquare size={18} />
      </MenuButton>

      <div className="w-px h-4 bg-gray-200 mx-1" />
      
      <MenuButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        label="Quote"
      >
        <Quote size={18} />
      </MenuButton>

      <MenuButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        label="Code Block"
      >
        <Code size={18} />
      </MenuButton>

      <MenuButton
        onClick={addTable}
        label="Table"
      >
        <Table size={18} />
      </MenuButton>

      <MenuButton
        onClick={addImage}
        label="Image"
      >
        <ImageIcon size={18} />
      </MenuButton>

      <MenuButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        label="Divider"
      >
        <Minus size={18} />
      </MenuButton>

    </FloatingMenu>
  );
}

export default EditorFloatingMenu;
