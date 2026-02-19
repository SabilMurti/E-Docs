import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';

export function TabItemView({ node }) {
  const isActive = node.attrs.isActive;

  return (
    <NodeViewWrapper 
      className={`tab-item-wrapper ${isActive ? 'block' : 'hidden'}`}
      style={{ display: isActive ? 'block' : 'none' }}
    >
      <NodeViewContent className="tab-item-content border-none outline-none focus:outline-none" />
    </NodeViewWrapper>
  );
}
