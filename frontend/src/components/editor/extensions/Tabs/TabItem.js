import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { TabItemView } from './TabItemView';

export const TabItem = Node.create({
  name: 'tabItem',
  group: 'block',
  content: 'block+',
  defining: true,
  isolating: false,

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
      // Allow backspace to work inside tab content
      Backspace: () => {
        const { selection, doc } = this.editor.state;
        const { $from, $to } = selection;

        // Check if we're at the start of a tabItem
        if (!$from.parent.isTextblock) return false;
        
        const parentDepth = $from.depth - 1;
        if (parentDepth < 0) return false;
        
        const parentNode = $from.node(parentDepth);
        if (parentNode?.type.name !== 'tabItem') return false;

        // If selection is not empty, allow default backspace
        if (!$from.pos === $to.pos) return false;

        // Check if we're at the start of the textblock
        const startPos = $from.start();
        if ($from.pos > startPos) return false;

        // At start of textblock inside tabItem - don't delete the tab
        // Just return false to let default behavior continue
        return false;
      },
    };
  },
});
