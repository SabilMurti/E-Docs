/**
 * Block Operations Utilities
 * Handles block-level operations like move, duplicate, delete, transform
 */

/**
 * Get the current block node and its position
 * @param {Editor} editor - Tiptap editor instance
 * @returns {{ node: Node, pos: number, depth: number } | null}
 */
export function getCurrentBlock(editor) {
  const { selection } = editor.state;
  const { $from } = selection;
  
  // Find the top-level block containing the cursor
  let depth = $from.depth;
  while (depth > 0) {
    const node = $from.node(depth);
    const pos = $from.before(depth);
    
    // Check if this is a direct child of the document
    if ($from.node(depth - 1).type.name === 'doc') {
      return { node, pos, depth };
    }
    depth--;
  }
  
  return null;
}

/**
 * Get the block at a specific position
 * @param {Editor} editor - Tiptap editor instance
 * @param {number} pos - Position in the document
 * @returns {{ node: Node, pos: number } | null}
 */
export function getBlockAtPos(editor, pos) {
  try {
    const $pos = editor.state.doc.resolve(pos);
    const node = editor.state.doc.nodeAt(pos);
    return node ? { node, pos } : null;
  } catch {
    return null;
  }
}

/**
 * Move block up in the document
 * @param {Editor} editor - Tiptap editor instance
 * @returns {boolean} - Whether the operation was successful
 */
export function moveBlockUp(editor) {
  const block = getCurrentBlock(editor);
  if (!block) return false;
  
  const { pos, node } = block;
  
  // Check if there's a block above
  if (pos <= 1) return false;
  
  // Find the previous sibling block
  const $pos = editor.state.doc.resolve(pos);
  const prevPos = $pos.before($pos.depth);
  
  if (prevPos < 0) return false;
  
  // Get previous block
  let searchPos = pos - 1;
  while (searchPos >= 0) {
    const prevNode = editor.state.doc.nodeAt(searchPos);
    if (prevNode) {
      // Found previous block, swap them
      const nodeSize = node.nodeSize;
      const prevNodeSize = prevNode.nodeSize;
      
      editor
        .chain()
        .focus()
        .command(({ tr }) => {
          // Delete current block
          tr.delete(pos, pos + nodeSize);
          // Re-insert before the previous block  
          tr.insert(searchPos, node);
          return true;
        })
        .run();
      
      return true;
    }
    searchPos--;
  }
  
  return false;
}

/**
 * Move block down in the document
 * @param {Editor} editor - Tiptap editor instance
 * @returns {boolean} - Whether the operation was successful
 */
export function moveBlockDown(editor) {
  const block = getCurrentBlock(editor);
  if (!block) return false;
  
  const { pos, node } = block;
  const nodeSize = node.nodeSize;
  const docSize = editor.state.doc.content.size;
  
  // Check if there's a block below
  const nextPos = pos + nodeSize;
  if (nextPos >= docSize) return false;
  
  const nextNode = editor.state.doc.nodeAt(nextPos);
  if (!nextNode) return false;
  
  const nextNodeSize = nextNode.nodeSize;
  
  editor
    .chain()
    .focus()
    .command(({ tr }) => {
      // Move the block after the next block
      tr.delete(pos, pos + nodeSize);
      tr.insert(pos + nextNodeSize - nodeSize, node);
      return true;
    })
    .run();
  
  return true;
}

/**
 * Duplicate the current block
 * @param {Editor} editor - Tiptap editor instance
 * @returns {boolean}
 */
export function duplicateBlock(editor) {
  const block = getCurrentBlock(editor);
  if (!block) return false;
  
  const { pos, node } = block;
  const nodeSize = node.nodeSize;
  
  editor
    .chain()
    .focus()
    .insertContentAt(pos + nodeSize, node.toJSON())
    .run();
  
  return true;
}

/**
 * Delete the current block
 * @param {Editor} editor - Tiptap editor instance
 * @returns {boolean}
 */
export function deleteBlock(editor) {
  const block = getCurrentBlock(editor);
  if (!block) return false;
  
  const { pos, node } = block;
  const nodeSize = node.nodeSize;
  
  editor
    .chain()
    .focus()
    .deleteRange({ from: pos, to: pos + nodeSize })
    .run();
  
  return true;
}

/**
 * Select the entire current block
 * @param {Editor} editor - Tiptap editor instance
 * @returns {boolean}
 */
export function selectBlock(editor) {
  const block = getCurrentBlock(editor);
  if (!block) return false;
  
  const { pos, node } = block;
  const nodeSize = node.nodeSize;
  
  editor.commands.setTextSelection({ from: pos, to: pos + nodeSize });
  return true;
}

/**
 * Transform block to another type
 * @param {Editor} editor - Tiptap editor instance
 * @param {string} newType - New block type name
 * @param {Object} attrs - Attributes for the new block
 * @returns {boolean}
 */
export function transformBlock(editor, newType, attrs = {}) {
  const block = getCurrentBlock(editor);
  if (!block) return false;
  
  const { pos, node } = block;
  
  // Get the text content
  const textContent = node.textContent;
  
  // Delete the current block and insert new type
  editor.chain().focus().run();
  
  switch (newType) {
    case 'heading':
      return editor.chain()
        .setNode('heading', attrs)
        .run();
    case 'paragraph':
      return editor.chain()
        .setParagraph()
        .run();
    case 'bulletList':
      return editor.chain()
        .toggleBulletList()
        .run();
    case 'orderedList':
      return editor.chain()
        .toggleOrderedList()
        .run();
    case 'taskList':
      return editor.chain()
        .toggleTaskList()
        .run();
    case 'blockquote':
      return editor.chain()
        .toggleBlockquote()
        .run();
    case 'codeBlock':
      return editor.chain()
        .toggleCodeBlock()
        .run();
    default:
      return false;
  }
}
