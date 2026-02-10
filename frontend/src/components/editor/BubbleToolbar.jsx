import { useState } from 'react';
import { BubbleMenu } from '@tiptap/react';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Palette, Link as LinkIcon,
  Heading2, AlignLeft, AlignCenter,
  X
} from 'lucide-react';

const ToolbarButton = ({ isActive, onClick, icon: Icon, tooltip, className = '' }) => (
  <button
    onClick={onClick}
    title={tooltip}
    type="button"
    className={`p-1.5 rounded hover:bg-gray-700 text-gray-300 hover:text-white transition-colors ${className} ${isActive ? 'bg-blue-500/20 text-blue-400' : ''}`}
  >
    <Icon size={14} />
  </button>
);

const Divider = () => <div className="w-px h-4 bg-gray-600 mx-1 self-center" />;

// Font Size control for text
const FontSizeSelector = ({ editor }) => {
  const currentSize = parseInt(editor.getAttributes('textStyle').fontSize) || 16;

  const handleChange = (e) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val) && val > 0) {
      editor.chain().focus().setFontSize(val).run();
    }
  };

  return (
    <div className="flex items-center mx-1">
      <input 
        type="number"
        value={currentSize}
        onChange={handleChange}
        className="w-10 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-white text-center focus:outline-none focus:border-blue-500"
        min="8"
        max="200"
        title="Font Size"
      />
    </div>
  );
};

export default function BubbleToolbar({ editor }) {
  const [showColorPicker, setShowColorPicker] = useState(false);

  if (!editor) return null;

  const colors = [
    { name: 'Default', value: null },
    { name: 'Gray', value: '#6b7280' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Yellow', value: '#eab308' },
    { name: 'Green', value: '#22c55e' },
    { name: 'Teal', value: '#14b8a6' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Pink', value: '#ec4899' }
  ];

  const shouldShow = ({ state }) => {
    const { selection } = state;
    return !selection.empty;
  };

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={shouldShow}
      tippyOptions={{ 
        duration: 100,
        placement: 'top',
        offset: [0, 12],
        maxWidth: 'none',
        appendTo: () => document.body,
      }}
      className="flex items-center gap-0.5 p-1.5 bg-[#1f2937] rounded-lg shadow-xl border border-gray-700 max-w-[90vw] overflow-visible"
    >

      <ToolbarButton
        isActive={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
        icon={Bold}
        tooltip="Bold"
      />
      <ToolbarButton
        isActive={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        icon={Italic}
        tooltip="Italic"
      />
      <ToolbarButton
        isActive={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        icon={UnderlineIcon}
        tooltip="Underline"
      />
      <ToolbarButton
        isActive={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        icon={Strikethrough}
        tooltip="Strikethrough"
      />
      
      <div className="relative">
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          className={`p-1.5 rounded hover:bg-gray-700 text-gray-300 hover:text-white transition-colors ${showColorPicker ? 'bg-blue-500/20 text-blue-400' : ''}`}
          title="Text Color"
        >
          <Palette size={14} />
        </button>
        
        {showColorPicker && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 p-2 bg-[#1f2937] border border-gray-600 rounded-lg shadow-xl grid grid-cols-5 gap-1 z-50 w-40">
            {colors.map((color) => (
              <button
                key={color.name}
                onClick={() => {
                  if (color.value) {
                    editor.chain().focus().setColor(color.value).run();
                  } else {
                    editor.chain().focus().unsetColor().run();
                  }
                  setShowColorPicker(false);
                }}
                className="w-6 h-6 rounded border border-gray-600 hover:scale-110 transition-transform flex items-center justify-center"
                style={{ backgroundColor: color.value || 'transparent' }}
                title={color.name}
              >
                {!color.value && <X size={12} className="text-gray-400" />}
              </button>
            ))}
          </div>
        )}
      </div>

      <Divider />

      <ToolbarButton
        isActive={editor.isActive({ textAlign: 'left' })}
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        icon={AlignLeft}
        tooltip="Align Left"
      />
      <ToolbarButton
        isActive={editor.isActive({ textAlign: 'center' })}
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        icon={AlignCenter}
        tooltip="Align Center"
      />
      
      <Divider />
      
      <ToolbarButton
         isActive={editor.isActive('heading', { level: 2 })}
         onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
         icon={Heading2}
         tooltip="Heading 2"
       />

       <ToolbarButton
        isActive={editor.isActive('link')}
        onClick={() => {
          const url = window.prompt('Enter URL:');
          if (url) {
            editor.chain().focus().setLink({ href: url }).run();
          }
        }}
        icon={LinkIcon}
        tooltip="Link"
      />

    </BubbleMenu>
  );
}
