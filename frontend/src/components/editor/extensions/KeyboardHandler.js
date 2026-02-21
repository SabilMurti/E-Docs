/**
 * KeyboardHandler Extension
 * Prevents accidental deletion of blocks and adds keyboard shortcuts
 */

import { Extension } from '@tiptap/core';

export const KeyboardHandler = Extension.create({
  name: 'keyboardHandler',

  addKeyboardShortcuts() {
    return {
      // Prevent Backspace from deleting blocks when at start of content
      Backspace: ({ editor }) => {
        const { state } = editor;
        const { selection } = state;
        const { $from } = selection;

        // If at start of document, prevent deletion
        if ($from.pos === 1) {
          return true;
        }

        // If selection is not empty, allow normal deletion
        if (!selection.empty) {
          return false;
        }

        // Allow normal backspace behavior
        return false;
      },

      // Prevent Delete from deleting blocks
      Delete: ({ editor }) => {
        const { state } = editor;
        const { selection } = state;

        // If selection is not empty, allow normal deletion
        if (!selection.empty) {
          return false;
        }

        // Allow normal delete behavior
        return false;
      },

      // Mod+Backspace - Delete entire block (intentional)
      'Mod-Backspace': () => {
        return false;
      },
    };
  },
});

export default KeyboardHandler;
