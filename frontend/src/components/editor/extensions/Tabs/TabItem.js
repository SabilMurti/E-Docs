import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { TabItemView } from './TabItemView';

export const TabItem = Node.create({
  name: 'tabItem',
  group: 'block',
  content: 'block+',
  defining: true,
  isolating: true,

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
});
