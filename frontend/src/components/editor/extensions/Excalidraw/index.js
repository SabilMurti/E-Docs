import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import ExcalidrawComponent from './ExcalidrawComponent';

export const ExcalidrawNode = Node.create({
  name: 'excalidraw',

  group: 'block',

  atom: true,

  draggable: true,

  addAttributes() {
    return {
      elements: {
        default: [],
      },
      appState: {
        default: {},
      },
      svgData: {
        default: '',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="excalidraw"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'excalidraw' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ExcalidrawComponent);
  },

  addCommands() {
    return {
      setExcalidraw: () => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
        });
      },
    };
  },
});
