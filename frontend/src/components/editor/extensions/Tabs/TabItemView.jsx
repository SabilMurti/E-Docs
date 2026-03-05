import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';

export function TabItemView({ node }) {
  const isActive = node.attrs.isActive ?? false;

  // CRITICAL: Do NOT use display:none on NodeViewWrapper.
  // display:none removes the element from DOM flow, causing ProseMirror to
  // lose cursor position tracking and the cursor "escapes" after one keystroke.
  //
  // Instead, use height:0 + overflow:hidden for inactive tabs — the nodes
  // stay in the DOM so ProseMirror can track them, but they are visually hidden.
  const hiddenStyle = {
    height: 0,
    overflow: 'hidden',
    pointerEvents: 'none',
    userSelect: 'none',
    opacity: 0,
  };

  return (
    <NodeViewWrapper
      className="tab-item-wrapper"
      style={isActive ? { minHeight: '1px' } : hiddenStyle}
    >
      <NodeViewContent className="tab-item-content" />
    </NodeViewWrapper>
  );
}
