import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import CardComponent from './CardComponent';

export const Card = Node.create({
  name: 'card',
  group: 'block',
  content: 'block+',
  draggable: true,
  isolating: true,

  addAttributes() {
    return {
      theme: {
        default: 'surface',
        parseHTML: element => element.getAttribute('data-theme'),
        renderHTML: attributes => ({ 'data-theme': attributes.theme }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="card"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'card',
        class: 'bg-[var(--color-bg-primary)] p-5 rounded-xl border-2 border-[var(--color-border-secondary)] shadow-md my-6',
      }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CardComponent);
  },

  addCommands() {
    return {
      setCard: (options = {}) => ({ commands }) => {
        return commands.insertContent({
          type: 'card',
          attrs: options,
          content: [
            {
              type: 'paragraph',
            },
          ],
        });
      },
    };
  },
});
