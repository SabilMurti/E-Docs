import Image from '@tiptap/extension-image';
import { ReactNodeViewRenderer } from '@tiptap/react';
import ResizableImageNode from '../nodes/ResizableImageNode';

export default Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: '100%',
        renderHTML: attributes => ({
          width: attributes.width,
        }),
      },
      height: {
        default: 'auto',
      },
      caption: {
        default: null,
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageNode);
  },
});
