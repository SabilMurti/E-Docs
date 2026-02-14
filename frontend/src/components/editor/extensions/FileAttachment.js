import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import FileNodeView from '../nodes/FileNodeView.jsx';

export default Node.create({
  name: 'fileAttachment',

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      title: {
        default: null,
      },
      size: {
        default: 0,
      },
      type: {
        default: 'application/octet-stream',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'file-attachment',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['file-attachment', mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(FileNodeView);
  },
});
