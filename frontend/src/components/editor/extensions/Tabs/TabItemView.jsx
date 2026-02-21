import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { useEffect, useState } from 'react';

export function TabItemView({ node, editor, getPos }) {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!editor || !getPos) return;

    const checkActive = () => {
      try {
        const pos = getPos();
        if (typeof pos !== 'number') return;

        // Find parent tabs node
        const $pos = editor.state.doc.resolve(pos);
        for (let d = $pos.depth; d >= 1; d--) {
          const parentNode = $pos.node(d);
          if (parentNode?.type.name === 'tabs') {
            const activeTab = parentNode.attrs.activeTab ?? 0;
            
            // Calculate our index within the parent
            let ourIndex = 0;
            const parentPos = $pos.before(d);
            parentNode.content.forEach((child, offset) => {
              if (parentPos + 1 + offset === pos) {
                setIsActive(ourIndex === activeTab);
              }
              ourIndex++;
            });
            break;
          }
        }
      } catch (e) {
        // Ignore errors
      }
    };

    checkActive();
    editor.on('update', checkActive);
    return () => editor.off('update', checkActive);
  }, [editor, getPos]);

  return (
    <NodeViewWrapper 
      className="tab-item-wrapper"
      style={{ display: isActive ? 'block' : 'none' }}
    >
      <NodeViewContent className="tab-item-content" />
    </NodeViewWrapper>
  );
}
