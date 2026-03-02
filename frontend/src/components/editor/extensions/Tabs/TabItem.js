import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { TabItemView } from './TabItemView';

export const TabItem = Node.create({
  name: 'tabItem',
  group: 'block',
  content: 'block+',
  defining: true,
  isolating: true,  // REQUIRED: prevents cursor from crossing tab boundaries (Arrow + Backspace)

  addAttributes() {
    return {
      title: {
        default: 'New Tab',
        parseHTML: element => element.getAttribute('data-title'),
        renderHTML: attributes => ({ 'data-title': attributes.title }),
      },
      isActive: {
        default: false,
        parseHTML: element => element.getAttribute('data-active') === 'true',
        renderHTML: attributes => ({ 'data-active': attributes.isActive }),
      }
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="tab-item"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'tab-item' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TabItemView);
  },

  addKeyboardShortcuts() {
    return {
      // Block Backspace from deleting/merging the tabItem when cursor is at its very start
      Backspace: () => {
        const { selection } = this.editor.state;
        const { $from, empty } = selection;

        if (!empty) return false;

        // Walk up to find enclosing tabItem
        for (let d = $from.depth; d >= 1; d--) {
          const node = $from.node(d);
          if (node.type.name === 'tabItem') {
            // Block if cursor is at the very first position inside this tabItem
            // $from.start(d) = first content position inside tabItem
            if ($from.pos <= $from.start(d)) {
              return true; // block — don't delete the tab
            }
            break;
          }
        }
        return false;
      },

      // Also block Delete at the very end to prevent merging with next tab
      Delete: () => {
        const { selection } = this.editor.state;
        const { $from, empty } = selection;

        if (!empty) return false;

        for (let d = $from.depth; d >= 1; d--) {
          const node = $from.node(d);
          if (node.type.name === 'tabItem') {
            if ($from.pos >= $from.end(d)) {
              return true; // block — don't merge into next tab
            }
            break;
          }
        }
        return false;
      },
    };
  },

});
