
// Core Tiptap Extensions
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
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
import Typography from '@tiptap/extension-typography';

// Custom Extensions
import Image from './extensions/ImageExtension';
import FileAttachment from './extensions/FileAttachment';
import { Callout } from './extensions/Callout/index.jsx';
import { CodeBlockPlus } from './extensions/CodeBlockPlus/index.jsx';
import { DragHandle } from './extensions/DragHandle';
import { ImageUpload } from './extensions/ImageUpload';
import { FontSize } from './extensions/FontSize';
import { Columns, Column } from './extensions/Columns';
import { Toggle } from './extensions/Toggle';
import { Card } from './extensions/Card';
import { ExcalidrawNode } from './extensions/Excalidraw';

export const getExtensions = (placeholderText = 'Start typing...') => [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
    dropcursor: { 
      color: 'var(--color-accent)', 
      width: 2 
    },
    // Disable default codeBlock, we use CodeBlockPlus
    codeBlock: false,
  }),
  
  Placeholder.configure({
    placeholder: ({ node }) => {
      if (node.type.name === 'heading') {
        return `Heading ${node.attrs.level}`;
      }
      if (node.type.name === 'codeBlock') {
        return null; // No placeholder for code blocks
      }
      return placeholderText;
    },
    includeChildren: true,
    showOnlyCurrent: true,
  }),
  
  // Custom Resizable Image
  Image.configure({
    inline: true,
    allowBase64: true,
  }),

  // File Attachments
  FileAttachment,
  
  Link.configure({ 
    openOnClick: false,
    HTMLAttributes: {
      class: 'text-[color:var(--color-accent)] underline hover:opacity-80 cursor-pointer',
    },
  }),
  
  TaskList.configure({
    HTMLAttributes: { class: 'task-list' },
  }),
  
  TaskItem.configure({ 
    nested: true,
    HTMLAttributes: { class: 'task-item' },
  }),
  
  Table.configure({
    resizable: true,
  }).extend({
    addAttributes() {
      return {
        style: {
          default: 'default',
          parseHTML: element => element.getAttribute('data-style'),
          renderHTML: attributes => ({ 'data-style': attributes.style }),
        },
      };
    },
  }),
  TableRow,
  TableHeader,
  TableCell.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        backgroundColor: {
          default: null,
          parseHTML: element => element.getAttribute('data-background-color'),
          renderHTML: attributes => {
            if (!attributes.backgroundColor) return {};
            return {
              'data-background-color': attributes.backgroundColor,
              style: `background-color: ${attributes.backgroundColor}`,
            };
          },
        },
      };
    },
  }),
  
  Highlight.configure({ multicolor: true }),
  Underline,
  
  Youtube.configure({ 
    width: 640, 
    height: 480,
    nocookie: true,
    controls: true,
    allowFullscreen: true,
  }),
  
  Subscript,
  Superscript,
  
  TextAlign.configure({ 
    types: ['heading', 'paragraph', 'image'] // Allow alignment on image if supported
  }),
  
  TextStyle,
  Color,
  Typography,
  
  // Custom extensions
  Callout,
  CodeBlockPlus,
  DragHandle,
  ImageUpload,
  FontSize,
  Columns,
  Column,
  Toggle,
  Card,
  ExcalidrawNode,
];
