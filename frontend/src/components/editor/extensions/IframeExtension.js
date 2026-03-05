import { Node, mergeAttributes } from '@tiptap/core';

export const Iframe = Node.create({
  name: 'iframe',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      width: {
        default: '100%',
      },
      height: {
        default: '100%',
      },
      allowfullscreen: {
        default: 'true',
      },
    };
  },

  parseHTML() {
    return [{ tag: 'iframe' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div', 
      { 
        class: 'embed-container', 
        style: 'position: relative; padding-bottom: 56.25%; margin: 1.5em 0; overflow: hidden; border-radius: 0.5rem;' 
      }, 
      [
        'iframe', 
        mergeAttributes(HTMLAttributes, { 
          style: 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;' 
        })
      ]
    ];
  },

  addCommands() {
    return {
      setIframe: (options) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        });
      },
    };
  },
});

export default Iframe;
