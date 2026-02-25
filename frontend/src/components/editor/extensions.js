
// Core Tiptap Extensions
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import Youtube from '@tiptap/extension-youtube';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Typography from '@tiptap/extension-typography';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Extension } from '@tiptap/core';

// Custom Extensions
import Image from './extensions/ImageExtension';
import FileAttachment from './extensions/FileAttachment';
import { Callout } from './extensions/Callout/index.jsx';
import { CodeBlockPlus } from './extensions/CodeBlockPlus/index.jsx';
// import { DragHandle } from './extensions/DragHandle';
import { ImageUpload } from './extensions/ImageUpload';
import { FontSize } from './extensions/FontSize';
import { Columns, Column } from './extensions/Columns';
import { Toggle } from './extensions/Toggle';
import { Card } from './extensions/Card';
import { ExcalidrawNode } from './extensions/Excalidraw';
import { Tabs, TabItem } from './extensions/Tabs';
import { ButtonNode } from './extensions/ButtonExtension';
import { APIEndpoint } from './extensions/APIEndpointExtension';
import { Steps } from './extensions/StepsExtension';
import { Step } from './extensions/StepExtension';
import { KeyboardHandler } from './extensions/KeyboardHandler';

// Extension to clean up pasted content (removes colors, bg-colors, and font families)
// This ensures pasted content respects the theme (especially in dark mode)
const CleanPaste = Extension.create({
  name: 'cleanPaste',
  priority: 1000, // Run before other extensions
  addEditorProps() {
    return {
      transformPastedHTML(html) {
        // Create a temporary element to parse and clean HTML
        const doc = new DOMParser().parseFromString(html, 'text/html');
        
        const cleanNode = (node) => {
          if (node.nodeType === 1) { // Element
            // Remove style properties that override theme colors
            const stylesToStrip = [
              'color', 'background', 'background-color', 
              'font-family', 'font-size', 'line-height',
              'text-align', 'direction', 'letter-spacing'
            ];
            
            stylesToStrip.forEach(prop => {
              node.style.removeProperty(prop);
            });

            // If style is now empty, remove it entirely
            if (node.getAttribute('style') === '') {
              node.removeAttribute('style');
            }

            // Remove legacy/problematic attributes
            const attrsToStrip = [
              'color', 'bgcolor', 'align', 'dir', 
              'face', 'size', 'width', 'height'
            ];
            
            // Only remove width/height if they aren't for images (handled by Image extension)
            const finalAttrsToStrip = node.nodeName === 'IMG' 
              ? attrsToStrip.filter(a => a !== 'width' && a !== 'height')
              : attrsToStrip;

            finalAttrsToStrip.forEach(attr => node.removeAttribute(attr));
            
            // Clean classes that might contain colors (like Tailwind text-black)
            if (node.className) {
              const classes = node.className.split(/\s+/);
              const cleanClasses = classes.filter(c => 
                !/^(text|bg|font|align|dir)-/.test(c)
              );
              if (cleanClasses.length > 0) {
                node.className = cleanClasses.join(' ');
              } else {
                node.removeAttribute('class');
              }
            }

            // Walk children
            node.childNodes.forEach(cleanNode);
          }
        };

        doc.body.childNodes.forEach(cleanNode);
        return doc.body.innerHTML;
      },
    };
  },
});

export const getExtensions = (placeholderText = 'Start typing...') => [
  CleanPaste,
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
    dropcursor: { 
      color: 'var(--color-accent)', 
      width: 2 
    },
    // Disable default codeBlock, we use CodeBlockPlus
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
      HTMLAttributes: {
        class: 'list-item-base',
      },
    },
  }),
  
  Placeholder.configure({
    placeholder: ({ node }) => {
      if (node.type.name === 'heading') {
        return `Heading ${node.attrs.level}`;
      }
      if (node.type.name === 'codeBlock') {
        return null; // No placeholder for code blocks
      }
      if (node.type.name === 'tableCell' || node.type.name === 'tableHeader') {
        return 'Text'; // Use simple text to prevent layout collapse
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

  Table.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        theme: {
          default: 'default',
          parseHTML: element => element.getAttribute('data-theme'),
          renderHTML: attributes => {
            return {
              'data-theme': attributes.theme,
            }
          },
        },
      }
    },
  }).configure({
    resizable: true,
    HTMLAttributes: {
      class: 'border-collapse table-auto w-full my-4',
    },
  }),
  TableRow,
  TableHeader.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        backgroundColor: {
          default: null,
          parseHTML: element => element.style.backgroundColor || null,
          renderHTML: attributes => {
            if (!attributes.backgroundColor) return {}
            return { style: `background-color: ${attributes.backgroundColor}` }
          },
        },
        borderColor: {
          default: '#e2e8f0',
          parseHTML: element => element.style.borderColor || null,
          renderHTML: attributes => {
            if (!attributes.borderColor) return {}
            return { style: `border-color: ${attributes.borderColor}` }
          },
        },
        borderWidth: {
          default: '1px',
          parseHTML: element => element.style.borderWidth || null,
          renderHTML: attributes => {
            if (!attributes.borderWidth) return {}
            return { style: `border-width: ${attributes.borderWidth}; border-style: solid` }
          },
        },
      }
    },
    renderHTML({ HTMLAttributes }) {
      return ['th', HTMLAttributes, 0];
    },
  }).configure({
    HTMLAttributes: {
      class: 'p-2 font-bold text-left bg-slate-100 dark:bg-slate-800',
    },
  }),
  TableCell.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        backgroundColor: {
          default: null,
          parseHTML: element => element.style.backgroundColor || null,
          renderHTML: attributes => {
            if (!attributes.backgroundColor) return {}
            return { style: `background-color: ${attributes.backgroundColor}` }
          },
        },
        borderColor: {
          default: '#e2e8f0',
          parseHTML: element => element.style.borderColor || null,
          renderHTML: attributes => {
            if (!attributes.borderColor) return {}
            return { style: `border-color: ${attributes.borderColor}` }
          },
        },
        borderWidth: {
          default: '1px',
          parseHTML: element => element.style.borderWidth || null,
          renderHTML: attributes => {
            if (!attributes.borderWidth) return {}
            return { style: `border-width: ${attributes.borderWidth}; border-style: solid` }
          },
        },
      }
    },
  }).configure({
    HTMLAttributes: {
      class: 'p-2 relative vertical-top',
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
  // DragHandle,
  ImageUpload,
  FontSize,
  Columns,
  Column,
  Toggle,
  Card,
  ExcalidrawNode,
  Tabs,
  TabItem,
  ButtonNode,
  APIEndpoint,
  Steps,
  Step,
  KeyboardHandler,
];
