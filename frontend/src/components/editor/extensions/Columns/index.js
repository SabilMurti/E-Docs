import { Node, mergeAttributes } from '@tiptap/core';

export const Column = Node.create({
  name: 'column',
  content: 'block+',
  isolating: true,

  addAttributes() {
    return {
      // Basic width implementation just in case we need it later
      // For now we rely on CSS Grid layout from the parent
      width: {
        default: null,
      },
    };
    
  },

  parseHTML() {
    return [{ tag: 'div[data-type="column"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 
        'data-type': 'column', 
        class: 'border-2 border-dashed border-gray-400 dark:border-gray-600 rounded-lg p-3 min-w-0 bg-[var(--color-bg-primary)]/50' 
      }),
      0
    ];
  },
});

export const Columns = Node.create({
  name: 'columns',
  group: 'block',
  content: 'column+', // Must contain one or more columns
  defining: true,
  isolating: true,

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'grid gap-4 my-4 sm:grid-cols-2', // Default to 2 columns on small screens+
      },
    };
  },

  addAttributes() {
    return {
      layout: {
        default: 'two-columns', // two-columns, three-columns, sidebar-left, sidebar-right
        parseHTML: element => element.getAttribute('data-layout'),
        renderHTML: attributes => ({ 'data-layout': attributes.layout }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="columns"]' }];
  },

  renderHTML({ HTMLAttributes, node }) {
    // Dynamic grid classes based on layout attribute
    let gridClass = 'grid gap-4 my-4 ';
    
    switch (node.attrs.layout) {
      case 'two-columns':
        gridClass += 'grid-cols-1 sm:grid-cols-2';
        break;
      case 'three-columns':
        gridClass += 'grid-cols-1 sm:grid-cols-3';
        break;
      case 'sidebar-left':
        gridClass += 'grid-cols-1 sm:grid-cols-[1fr_2fr]';
        break;
      case 'sidebar-right':
        gridClass += 'grid-cols-1 sm:grid-cols-[2fr_1fr]';
        break;
      default:
        gridClass += 'grid-cols-1 sm:grid-cols-2';
    }

    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { 
        'data-type': 'columns',
        class: gridClass 
      }),
      0
    ];
  },

  addCommands() {
    return {
      setColumns: ({ layout = 'two-columns' } = {}) => ({ commands }) => {
        let count = 2;
        if (layout === 'three-columns') count = 3;
        
        // Create columns content array
        // We create empty paragraphs inside columns to make them editable immediately
        const content = [];
        for (let i = 0; i < count; i++) {
           content.push({
             type: 'column',
             content: [{ type: 'paragraph' }]
           });
        }

        return commands.insertContent({
          type: 'columns',
          attrs: { layout },
          content: content
        });
      },
      unsetColumns: () => ({ commands }) => {
        // Basic implementation: lift content out of columns
        // This is complex, usually easiest to just delete the node for MVP
        return commands.deleteSelection();
      },
    };
  },
});
