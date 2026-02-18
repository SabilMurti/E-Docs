import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { TabsView } from './TabsView';

export const Tabs = Node.create({
  name: 'tabs',
  group: 'block',
  content: 'tabItem+',
  defining: true,
  isolating: true,

  addAttributes() {
    return {
      activeTab: {
        default: 0,
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="tabs"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'tabs', class: 'tabs-container' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TabsView);
  },
  
  addCommands() {
    return {
      setTabs: () => ({ commands }) => {
        return commands.insertContent({
          type: 'tabs',
          attrs: { activeTab: 0 },
          content: [
            { type: 'tabItem', attrs: { title: 'Detail Barang' }, content: [{ type: 'paragraph' }] },
            { type: 'tabItem', attrs: { title: 'Pungutan' }, content: [{ type: 'paragraph' }] }
          ]
        });
      }
    }
  }
});
