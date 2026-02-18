import { Node, mergeAttributes } from '@tiptap/core';

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
      class: {
        default: 'tab-panel',
        renderHTML: attributes => ({ class: 'tab-panel p-4' }),
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
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'tab-item', 'data-tab-panel': '' }), 0];
  },
});
