import { FloatingMenu } from '@tiptap/react';
import { 
  Heading1, Heading2, List, ListOrdered, CheckSquare, 
  Quote, Image as ImageIcon, Code, Table, Minus, 
  Youtube, Paperclip 
} from 'lucide-react';
import { useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { uploadFile } from '../../api/upload';

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
  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);

 if (!editor) return null;

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading('Uploading image...');
    try {
      const data = await uploadFile(file);
      editor.chain().focus().setImage({ src: data.url, alt: data.filename }).run();
      toast.dismiss(toastId);
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload image', { id: toastId });
    } finally {
        if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading('Uploading file...');
    try {
      const data = await uploadFile(file);
      editor.chain().focus().insertContent({
        type: 'fileAttachment',
        attrs: {
          src: data.url,
          title: data.filename,
          size: data.size,
          type: data.type
        }
      }).run();
      toast.dismiss(toastId);
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload file', { id: toastId });
    } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };
const addYoutube = useCallback(() => {
    const url = window.prompt('Enter YouTube URL:');
    if (url) {
      editor.commands.setYoutubeVideo({ src: url });
    }
  }, [editor]);

  const addTable = useCallback(() => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  return (
    <>
      <input 
        type="file" 
        ref={imageInputRef} 
        hidden 
        accept="image/*" 
        onChange={handleImageUpload} 
      />
      <input 
        type="file" 
        ref={fileInputRef} 
        hidden 
        // accept all
        onChange={handleFileUpload} 
      />

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

        <div className="w-px h-4 bg-gray-200 mx-1" />

        <MenuButton
          onClick={() => imageInputRef.current?.click()}
          label="Upload Image"
        >
          <ImageIcon size={18} />
        </MenuButton>

        <MenuButton
          onClick={addYoutube}
          label="Embed YouTube"
        >
            <Youtube size={18} />
        </MenuButton>

        <MenuButton
            onClick={() => fileInputRef.current?.click()}
            label="Attach File"
        >
            <Paperclip size={18} />
        </MenuButton>

        <MenuButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          label="Divider"
        >
          <Minus size={18} />
        </MenuButton>

      </FloatingMenu>
    </>
  );
}

export default EditorFloatingMenu;
