import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import StepsBlock from '../nodes/StepsBlock';

export const Steps = Node.create({
  name: 'steps',

  group: 'block',

  content: 'step+',

  defining: true,

  isolating: true,

  addAttributes() {
    return {
      completedSteps: {
        default: [],
        parseHTML: element => {
          try {
            const data = element.getAttribute('data-completed-steps');
            return data ? JSON.parse(data) : [];
          } catch {
            return [];
          }
        },
        renderHTML: attributes => {
          if (!attributes.completedSteps || attributes.completedSteps.length === 0) {
            return {};
          }
          return {
            'data-completed-steps': JSON.stringify(attributes.completedSteps),
          };
        },
      },
      title: {
        default: 'Steps',
        parseHTML: element => element.getAttribute('data-title') || 'Steps',
        renderHTML: attributes => ({
          'data-title': attributes.title,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="steps"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'steps' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(StepsBlock);
  },

  addCommands() {
    return {
      setSteps: () => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: { 
            completedSteps: [],
            title: 'Steps'
          },
          content: [
            {
              type: 'step',
              content: [
                { type: 'paragraph', content: [{ type: 'text', text: 'First step description' }] }
              ]
            },
            {
              type: 'step',
              content: [
                { type: 'paragraph', content: [{ type: 'text', text: 'Second step description' }] }
              ]
            },
            {
              type: 'step',
              content: [
                { type: 'paragraph', content: [{ type: 'text', text: 'Third step description' }] }
              ]
            }
          ]
        });
      },
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-s': () => this.editor.commands.setSteps(),
    };
  },
});

export default Steps;
