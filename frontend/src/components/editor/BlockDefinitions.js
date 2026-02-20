/* 
 * Block Definitions - Single source of truth untuk semua block types
 * Digunakan oleh SlashCommandMenu dan BlockMenuDropdown
 */

import {
  Type, Heading1, Heading2, Heading3,
  List, ListOrdered, CheckSquare, Minus,
  Quote, Code2, Info, AlertTriangle, CheckCircle2, XCircle,
  CreditCard, AppWindow, Maximize2,
  Footprints, LayoutGrid, FileUp, Image as ImageIcon,
  Globe, Youtube as YoutubeIcon, Link2, Calculator, Braces, PenTool, Layers, Table
} from 'lucide-react';

// Block type definitions with categories
export const BLOCK_DEFINITIONS = [
  {
    category: 'Basic blocks',
    items: [
      {
        id: 'paragraph',
        name: 'Paragraph',
        icon: Type,
        description: 'Plain text block',
        shortcut: null,
        action: (editor) => editor.chain().focus().setParagraph().run()
      },
      {
        id: 'heading1',
        name: 'Heading 1',
        icon: Heading1,
        description: 'Large section heading',
        shortcut: '#',
        action: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run()
      },
      {
        id: 'heading2',
        name: 'Heading 2',
        icon: Heading2,
        description: 'Medium section heading',
        shortcut: '##',
        action: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run()
      },
      {
        id: 'heading3',
        name: 'Heading 3',
        icon: Heading3,
        description: 'Small section heading',
        shortcut: '###',
        action: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run()
      },
      {
        id: 'bulletList',
        name: 'Bullet List',
        icon: List,
        description: 'Unordered list',
        shortcut: '-',
        action: (editor) => editor.chain().focus().toggleBulletList().run()
      },
      {
        id: 'orderedList',
        name: 'Numbered List',
        icon: ListOrdered,
        description: 'Ordered list',
        shortcut: '1.',
        action: (editor) => editor.chain().focus().toggleOrderedList().run()
      },
      {
        id: 'taskList',
        name: 'Task List',
        icon: CheckSquare,
        description: 'Checklist with checkboxes',
        shortcut: '[]',
        action: (editor) => editor.chain().focus().toggleTaskList().run()
      },
      {
        id: 'divider',
        name: 'Divider',
        icon: Minus,
        description: 'Horizontal separator',
        shortcut: '---',
        action: (editor) => editor.chain().focus().setHorizontalRule().run()
      },
      {
        id: 'quote',
        name: 'Quote',
        icon: Quote,
        description: 'Blockquote for citations',
        shortcut: '>',
        action: (editor) => editor.chain().focus().toggleBlockquote().run()
      },
      {
        id: 'codeBlock',
        name: 'Code Block',
        icon: Code2,
        description: 'Code with syntax highlighting',
        shortcut: '```',
        action: (editor) => editor.chain().focus().toggleCodeBlock().run()
      }
    ]
  },
  {
    category: 'Callouts',
    items: [
      {
        id: 'hintInfo',
        name: 'Info',
        icon: Info,
        description: 'Informational callout',
        action: (editor) => editor.chain().focus().insertContent({
          type: 'callout',
          attrs: { type: 'info' },
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Informational note goes here...' }] }]
        }).run()
      },
      {
        id: 'hintSuccess',
        name: 'Success',
        icon: CheckCircle2,
        description: 'Success callout',
        action: (editor) => editor.chain().focus().insertContent({
          type: 'callout',
          attrs: { type: 'success' },
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Success message goes here...' }] }]
        }).run()
      },
      {
        id: 'hintWarning',
        name: 'Warning',
        icon: AlertTriangle,
        description: 'Warning callout',
        action: (editor) => editor.chain().focus().insertContent({
          type: 'callout',
          attrs: { type: 'warning' },
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Warning message goes here...' }] }]
        }).run()
      },
      {
        id: 'hintDanger',
        name: 'Danger',
        icon: XCircle,
        description: 'Danger callout',
        action: (editor) => editor.chain().focus().insertContent({
          type: 'callout',
          attrs: { type: 'danger' },
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Danger message goes here...' }] }]
        }).run()
      }
    ]
  },
  {
    category: 'Advanced blocks',
    items: [
      {
        id: 'cards',
        name: 'Cards',
        icon: CreditCard,
        description: 'Side-by-side card layout',
        action: (editor) => editor.chain().focus().setCard().run()
      },
      {
        id: 'expandable',
        name: 'Toggle / Expandable',
        icon: Maximize2,
        description: 'Collapsible section',
        action: (editor) => editor.chain().focus().setToggle({ summary: 'Click to expand' }).run()
      },
      {
        id: 'stepper',
        name: 'Steps',
        icon: Footprints,
        description: 'Step-by-step guide',
        action: (editor) => editor.chain().focus().setSteps().run()
      },
      {
        id: 'columns',
        name: 'Columns',
        icon: LayoutGrid,
        description: 'Multi-column layout',
        action: (editor) => editor.chain().focus().setColumns({ layout: 'two-columns' }).run()
      },
      {
        id: 'tabs',
        name: 'Tabs',
        icon: Layers,
        description: 'Interactive tabbed content',
        action: (editor) => editor.chain().focus().insertContent({
          type: 'tabs',
          attrs: { activeTab: 0 },
          content: [
            { 
              type: 'tabItem', 
              attrs: { title: 'Tab 1' }, 
              content: [
                { type: 'paragraph', content: [{ type: 'text', text: 'Isi konten untuk Tab 1 di sini...' }] }
              ] 
            },
            { 
              type: 'tabItem', 
              attrs: { title: 'Tab 2' }, 
              content: [
                { type: 'paragraph', content: [{ type: 'text', text: 'Isi konten untuk Tab 2 di sini...' }] }
              ] 
            }
          ]
        }).run()
      },
      {
        id: 'table',
        name: 'Table',
        icon: Table,
        description: 'Insert a table',
        action: (editor) => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
      }
    ]
  },
  {
    category: 'Media & Embeds',
    items: [
      {
        id: 'image',
        name: 'Image',
        icon: ImageIcon,
        description: 'Upload or embed image',
        action: (editor) => {
          // Trigger modal via event
          const event = new CustomEvent('openMediaModal', { detail: { type: 'image' } });
          window.dispatchEvent(event);
        }
      },
      {
        id: 'youtube',
        name: 'YouTube',
        icon: YoutubeIcon,
        description: 'Embed YouTube video',
        action: (editor, extra) => {
          const url = extra?.url || window.prompt('Enter YouTube URL:');
          if (url) {
            editor.chain().focus().setYoutubeVideo({ src: url }).run();
          }
        }
      },
      {
        id: 'embed',
        name: 'Embed URL',
        icon: Globe,
        description: 'Embed external content',
        action: (editor, extra) => {
          const url = extra?.url || window.prompt('Enter URL to embed:');
          if (url) {
            // Check if YouTube
            if (url.includes('youtube.com') || url.includes('youtu.be')) {
              editor.chain().focus().setYoutubeVideo({ src: url }).run();
            } else {
              editor.chain().focus().insertContent(`
                <div class="embed-container" style="position: relative; padding-bottom: 56.25%; margin: 1.5em 0;">
                  <iframe src="${url}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; border-radius: 0.5rem;"></iframe>
                </div>
              `).run();
            }
          }
        }
      },
      {
        id: 'file',
        name: 'File Attachment',
        icon: FileUp,
        description: 'Link to a file',
        action: (editor) => editor.chain().focus().triggerFileUpload().run()
      }
    ]
  },
  {
    category: 'Integrations',
    items: [
      {
        id: 'pageLink',
        name: 'Page Link',
        icon: Link2,
        description: 'Link to another page',
        action: (editor, extra) => {
          const url = extra?.url || window.prompt('Enter page URL or slug:');
          if (url) {
            editor.chain().focus().insertContent(`
              <p>📄 <a href="${url}" class="text-[var(--color-accent)] underline hover:opacity-80">${url}</a></p>
            `).run();
          }
        }
      },
      {
        id: 'button',
        name: 'Button',
        icon: Maximize2,
        description: 'Button linking to another page',
        action: (editor, extra) => {
          const config = extra || {
            text: 'Click here',
            url: '#',
            variant: 'primary'
          };
          editor.chain().focus().insertContent({
            type: 'button',
            attrs: {
              text: config.text,
              url: config.url,
              variant: config.variant || 'primary'
            }
          }).run();
        }
      },
      {
        id: 'math',
        name: 'Math / LaTeX',
        icon: Calculator,
        description: 'Insert math symbols',
        action: (editor) => {
          // Just a placeholder - actual math symbols are in the toolbar dropdown
          console.log('Use the ∑ button in toolbar for math symbols');
        }
      },
      {
        id: 'api',
        name: 'API Endpoint',
        icon: Braces,
        description: 'API documentation block',
        action: (editor) => editor.chain().focus().setAPIEndpoint({
          method: 'GET',
          endpoint: '/api/v1/endpoint',
          description: 'API endpoint description...'
        }).run()
      },
      {
        id: 'flowchart',
        name: 'Flowchart',
        icon: PenTool,
        description: 'Visual diagram with toolbar',
        action: (editor) => editor.chain().focus().setExcalidraw().run()
      }
    ]
  }
];

// Flatten all blocks for search
export const getAllBlocks = () => {
  return BLOCK_DEFINITIONS.flatMap(category => 
    category.items.map(item => ({
      ...item,
      category: category.category
    }))
  );
};

// Search blocks by query
export const searchBlocks = (query) => {
  if (!query) return getAllBlocks();
  
  const lowerQuery = query.toLowerCase();
  return getAllBlocks().filter(block =>
    block.name.toLowerCase().includes(lowerQuery) ||
    block.description.toLowerCase().includes(lowerQuery) ||
    block.category.toLowerCase().includes(lowerQuery)
  );
};
