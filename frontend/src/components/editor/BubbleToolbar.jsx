import { useState } from 'react';
import { BubbleMenu } from '@tiptap/react';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Code, Highlighter, Palette, Link as LinkIcon,
  Heading2, Heading3, AlignLeft, AlignCenter, AlignRight,
  Superscript as SuperscriptIcon, Subscript as SubscriptIcon,
  X
} from 'lucide-react';

// Move components outside render function
const ToolbarButton = ({ isActive, onClick, icon: Icon, tooltip, className = '' }) => (
  <button
    onClick={onClick}
    title={tooltip}
    className={`bubble-toolbar-btn ${className} ${isActive ? 'active' : ''}`}
  >
    <Icon size={14} />
  </button>
);

const Divider = () => <div className="bubble-toolbar-divider" />;

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

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{ 
        duration: 100,
        placement: 'top',
        offset: [0, 8]
      }}
      className="bubble-toolbar"
    >
      {/* Text Formatting */}
      <ToolbarButton
        isActive={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
        icon={Bold}
        tooltip="Bold (Ctrl+B)"
      />
      <ToolbarButton
        isActive={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        icon={Italic}
        tooltip="Italic (Ctrl+I)"
      />
      <ToolbarButton
        isActive={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        icon={UnderlineIcon}
        tooltip="Underline (Ctrl+U)"
      />
      <ToolbarButton
        isActive={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        icon={Strikethrough}
        tooltip="Strikethrough"
      />
      <ToolbarButton
        isActive={editor.isActive('code')}
        onClick={() => editor.chain().focus().toggleCode().run()}
        icon={Code}
        tooltip="Inline Code"
      />

      <Divider />

      {/* Super/Subscript */}
      <ToolbarButton
        isActive={editor.isActive('superscript')}
        onClick={() => editor.chain().focus().toggleSuperscript().run()}
        icon={SuperscriptIcon}
        tooltip="Superscript"
      />
      <ToolbarButton
        isActive={editor.isActive('subscript')}
        onClick={() => editor.chain().focus().toggleSubscript().run()}
        icon={SubscriptIcon}
        tooltip="Subscript"
      />

      <Divider />

      {/* Highlight */}
      <ToolbarButton
        isActive={editor.isActive('highlight')}
        onClick={() => editor.chain().focus().toggleHighlight({ color: '#fef08a' }).run()}
        icon={Highlighter}
        tooltip="Highlight"
      />

      {/* Color Picker */}
      <div className="relative">
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          className={`bubble-toolbar-btn ${showColorPicker ? 'active' : ''}`}
          title="Text Color"
        >
          <Palette size={14} />
        </button>
        
        {showColorPicker && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 p-2 bg-[color:var(--color-bg-elevated)] border border-[color:var(--color-border-primary)] rounded-lg shadow-xl grid grid-cols-5 gap-1 z-50 animate-scaleIn">
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
                className="w-6 h-6 rounded border border-[color:var(--color-border-primary)] hover:scale-110 transition-transform flex items-center justify-center"
                style={{ backgroundColor: color.value || 'transparent' }}
                title={color.name}
              >
                {!color.value && <X size={12} className="text-[color:var(--color-text-muted)]" />}
              </button>
            ))}
          </div>
        )}
      </div>

      <Divider />

      {/* Text Alignment */}
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
      <ToolbarButton
        isActive={editor.isActive({ textAlign: 'right' })}
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        icon={AlignRight}
        tooltip="Align Right"
      />

      <Divider />

      {/* Headings */}
      <ToolbarButton
        isActive={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        icon={Heading2}
        tooltip="Heading 2"
      />
      <ToolbarButton
        isActive={editor.isActive('heading', { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        icon={Heading3}
        tooltip="Heading 3"
      />

      <Divider />

      {/* Link */}
      <ToolbarButton
        isActive={editor.isActive('link')}
        onClick={() => {
          const url = window.prompt('Enter URL:');
          if (url) {
            editor.chain().focus().setLink({ href: url }).run();
          }
        }}
        icon={LinkIcon}
        tooltip="Add Link"
      />
    </BubbleMenu>
  );
}
