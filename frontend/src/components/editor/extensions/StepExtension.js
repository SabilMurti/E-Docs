import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import StepBlock from '../nodes/StepBlock';

export const Step = Node.create({
  name: 'step',

  group: 'block',

  content: 'block+',

  defining: true,

  draggable: true,

  parseHTML() {
    return [
      {
        tag: 'div[data-type="step"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'step' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(StepBlock);
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Enter': () => {
        const { state } = this.editor.view;
        const { $from } = state.selection;
        
        for (let d = $from.depth; d > 0; d--) {
          if ($from.node(d).type.name === this.name) {
            const pos = $from.after(d);
            return this.editor.chain()
              .focus()
              .insertContentAt(pos, {
                type: 'step',
                content: [{ type: 'paragraph' }]
              })
              .run();
          }
        }
        return false;
      },
    };
  },
});

export default Step;
