import { Node, mergeAttributes, nodeInputRule } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import ButtonBlock from '../nodes/ButtonNode';

export const ButtonNode = Node.create({
  name: 'button',

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      text: {
        default: 'Click here',
        parseHTML: element => element.getAttribute('data-text'),
        renderHTML: attributes => ({
          'data-text': attributes.text,
        }),
      },
      url: {
        default: '#',
        parseHTML: element => element.getAttribute('data-url'),
        renderHTML: attributes => ({
          'data-url': attributes.url,
        }),
      },
      variant: {
        default: 'primary',
        parseHTML: element => element.getAttribute('data-variant'),
        renderHTML: attributes => ({
          'data-variant': attributes.variant,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="button"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'button' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ButtonBlock);
  },

  addCommands() {
    return {
      setButton: (attributes) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: attributes,
        });
      },
    };
  },

  addInputRules() {
    return [
      nodeInputRule({
        find: /^\[([^\]]+)\]\(([^)]+)\)$/,
        type: this.type,
        getAttributes: (match) => {
          const [, text, url] = match;
          return { text, url };
        },
      }),
    ];
  },
});

export default ButtonNode;
