import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import CardComponent from './CardComponent';

export const Card = Node.create({
  name: 'card',
  group: 'block',
  content: 'block+',
  draggable: true,
  // Removed isolating: true — it was causing content to "escape" the card
  // when typing, because isolating blocks cursor navigation in unexpected ways.

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

  addKeyboardShortcuts() {
    return {
      // When pressing Enter at the END of a card's last block,
      // create a new paragraph OUTSIDE the card instead of inside it.
      Enter: ({ editor }) => {
        const { state } = editor;
        const { selection } = state;
        const { $from } = selection;

        // Check if we're inside a 'card' node
        let cardDepth = -1;
        for (let depth = $from.depth; depth >= 0; depth--) {
          if ($from.node(depth).type.name === 'card') {
            cardDepth = depth;
            break;
          }
        }
        if (cardDepth === -1) return false; // Not inside a card

        const cardNode = $from.node(cardDepth);
        const cardEnd = $from.end(cardDepth);

        // Only exit card on Enter if cursor is at the very end of the last block
        const isAtEnd = $from.pos === cardEnd - 1;
        if (!isAtEnd) return false;

        // Get the position after the card node
        const afterCard = $from.after(cardDepth);
        editor
          .chain()
          .insertContentAt(afterCard, { type: 'paragraph' })
          .setTextSelection(afterCard + 1)
          .run();
        return true;
      },
    };
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
