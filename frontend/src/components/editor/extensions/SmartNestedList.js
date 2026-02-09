import { Extension, InputRule } from '@tiptap/core';

export const SmartNestedList = Extension.create({
  name: 'smartNestedList',

  addInputRules() {
    return [
      // Bullet List: - or * or +
      new InputRule({
        find: /^\s*([-+*])\s$/,
        handler: ({ state, chain, range }) => {
          // Check if we are in a list item
          const { $from } = state.selection;
          const parent = $from.node(-1);
          
          if (!parent) return null;

          const isListItem = parent.type.name === 'listItem' || parent.type.name === 'taskItem';
          
          // Delete the triggered text (e.g. "- ")
          chain().deleteRange(range).run();

          if (isListItem) {
            // Try to sink indentation first
            // We try both because we don't know which one we are in easily without more checks
            const sank = chain().sinkListItem('listItem').run() || chain().sinkListItem('taskItem').run();
            
            if (sank) {
              // If indentation worked, convert to bullet list
              return chain().toggleBulletList().run();
            }
          }
          
          // Fallback: just toggle
          return chain().toggleBulletList().run();
        },
      }),

      // Ordered List: 1.
      new InputRule({
        find: /^(\d+)\.\s$/,
        handler: ({ state, chain, range }) => {
          const { $from } = state.selection;
          const parent = $from.node(-1);
          if (!parent) return null;

          const isListItem = parent.type.name === 'listItem' || parent.type.name === 'taskItem';

          chain().deleteRange(range).run();

          if (isListItem) {
            const sank = chain().sinkListItem('listItem').run() || chain().sinkListItem('taskItem').run();
            if (sank) {
              return chain().toggleOrderedList().run();
            }
          }

          return chain().toggleOrderedList().run();
        },
      }),

      // Task List: [ ] or [x]
      new InputRule({
        find: /^\s*\[([ |x])\]\s$/,
        handler: ({ state, chain, range }) => {
          const { $from } = state.selection;
          const parent = $from.node(-1);
          if (!parent) return null;

          const isListItem = parent.type.name === 'listItem' || parent.type.name === 'taskItem';

          chain().deleteRange(range).run();

          if (isListItem) {
            const sank = chain().sinkListItem('listItem').run() || chain().sinkListItem('taskItem').run();
            if (sank) {
              return chain().toggleTaskList().run();
            }
          }

          return chain().toggleTaskList().run();
        },
      }),
    ];
  },
});
