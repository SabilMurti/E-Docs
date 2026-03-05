import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import ToggleComponent from './ToggleComponent';

export const Toggle = Node.create({
  name: 'toggle',
  group: 'block',
  content: 'block+',
  draggable: true,
  // Removed isolating: true — it was making content disappear when typing,
  // because isolating blocks normal cursor/content flow in unexpected ways.

  addAttributes() {
    return {
      summary: {
        default: '',
      },
      isOpen: {
        default: true,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'details[data-type="toggle"]',
        getAttrs: (element) => ({
          summary: element.getAttribute('data-summary'),
          isOpen: element.getAttribute('open') !== null,
        }),
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'details',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'toggle',
        'data-summary': node.attrs.summary,
        open: node.attrs.isOpen ? '' : null,
        class: 'details-reset my-4 border-2 border-[var(--color-border-secondary)] rounded-lg overflow-hidden',
      }),
      ['summary', { class: 'px-4 py-2 bg-[var(--color-bg-tertiary)] font-medium cursor-pointer flex items-center gap-2 select-none' },
        node.attrs.summary || 'Toggle'
      ],
      ['div', { class: 'px-4 py-2 border-t border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)]' }, 0],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ToggleComponent);
  },

  addKeyboardShortcuts() {
    return {
      // On Enter at the very end of a toggle's last block, exit the toggle
      Enter: ({ editor }) => {
        const { state } = editor;
        const { selection } = state;
        const { $from } = selection;

        let toggleDepth = -1;
        for (let depth = $from.depth; depth >= 0; depth--) {
          if ($from.node(depth).type.name === 'toggle') {
            toggleDepth = depth;
            break;
          }
        }
        if (toggleDepth === -1) return false;

        const toggleEnd = $from.end(toggleDepth);
        const isAtEnd = $from.pos === toggleEnd - 1;
        if (!isAtEnd) return false;

        const afterToggle = $from.after(toggleDepth);
        editor
          .chain()
          .insertContentAt(afterToggle, { type: 'paragraph' })
          .setTextSelection(afterToggle + 1)
          .run();
        return true;
      },
    };
  },

  addCommands() {
    return {
      setToggle: (options = {}) => ({ commands }) => {
        return commands.insertContent({
          type: 'toggle',
          attrs: {
            summary: options.summary || '',
            isOpen: options.isOpen ?? true,
          },
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
