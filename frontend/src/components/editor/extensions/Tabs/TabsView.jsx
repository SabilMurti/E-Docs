import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { useState, useEffect, useRef } from 'react';
import { Plus, X } from 'lucide-react';

export function TabsView({ node, updateAttributes, editor, getPos }) {
  const [editingTitleIndex, setEditingTitleIndex] = useState(null);
  const activeTab = node.attrs.activeTab ?? 0;
  
  const [titles, setTitles] = useState([]);

  useEffect(() => {
    const currentTitles = [];
    node.content.forEach((child) => {
      currentTitles.push(child.attrs.title || 'Tab');
    });
    setTitles(currentTitles);
  }, [node.content, node.childCount]);

  const handleTabClick = (index) => {
    // 1. Update the active tab index
    updateAttributes({ activeTab: index });
    
    // 2. Manage Focus (Crucial for workspace isolation)
    // Wait for the state to settle, then move cursor into the selected tab
    setTimeout(() => {
      if (!editor) return;
      
      let currentPos = getPos() + 1; // Position inside the Tabs node
      let targetTabPos = -1;
      
      node.content.forEach((child, i) => {
        if (i === index) {
          targetTabPos = currentPos;
          return false; // break
        }
        currentPos += child.nodeSize;
      });

      if (targetTabPos !== -1) {
        // focus the start of the TabItem content area
        editor.commands.focus(targetTabPos + 1);
      }
    }, 20);
  };

  const handleAddTab = () => {
    const pos = getPos() + node.nodeSize - 1;
    editor.chain().focus().insertContentAt(pos, {
      type: 'tabItem',
      attrs: { title: `Tab ${titles.length + 1}` },
      content: [{ type: 'paragraph' }]
    }).run();
    
    // Link directly to tab click logic for auto-focus
    handleTabClick(titles.length);
  };

  const updateTabTitle = (index, newTitle) => {
    let pos = getPos() + 1;
    let targetPos = -1;
    
    node.content.forEach((child, i) => {
      if (i === index) targetPos = pos;
      pos += child.nodeSize;
    });

    if (targetPos !== -1) {
      editor.chain().setNodeSelection(targetPos).updateAttributes('tabItem', { title: newTitle }).run();
      const newTitles = [...titles];
      newTitles[index] = newTitle;
      setTitles(newTitles);
    }
    setEditingTitleIndex(null);
  };
  
  const removeTab = (e, index) => {
    e.stopPropagation();
    if (titles.length <= 1) return;
    
    let pos = getPos() + 1;
    let targetPos = -1;
    let size = 0;
    
    node.content.forEach((child, i) => {
      if (i === index) {
        targetPos = pos;
        size = child.nodeSize;
      }
      pos += child.nodeSize;
    });

    if (targetPos !== -1) {
      editor.chain().deleteRange({ from: targetPos, to: targetPos + size }).run();
      if (activeTab >= index && activeTab > 0) {
        handleTabClick(activeTab - 1);
      }
    }
  };

  return (
    <NodeViewWrapper className="tabs-workspace my-8 relative rounded-xl border border-[var(--color-border-primary)] shadow-md overflow-hidden bg-[var(--color-bg-primary)]">
      {/* Workspace Isolation Styles */}
      <style>{`
        .tabs-content-area > [data-tab-panel] { 
          display: none !important; 
        }
        .tabs-content-area > [data-tab-panel]:nth-child(${activeTab + 1}) { 
          display: block !important; 
          animation: tab-switch-in 0.15s ease-out;
        }
        @keyframes tab-switch-in {
          from { opacity: 0; transform: translateY(2px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Tab Bar (Browser-like) */}
      <div className="flex items-center gap-0.5 border-b border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] px-2 pt-2 overflow-x-auto no-scrollbar">
        {titles.map((title, index) => (
          <button
            key={index}
            onClick={() => handleTabClick(index)}
            className={`
              flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-all duration-150 border-t border-l border-r outline-none select-none
              ${index === activeTab 
                ? 'bg-[var(--color-bg-primary)] border-[var(--color-border-primary)] text-[var(--color-text-primary)] -mb-[1px] z-10 shadow-[0_-2px_0_0_var(--color-accent)]' 
                : 'bg-transparent border-transparent text-[var(--color-text-muted)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]'
              }
            `}
          >
            {editingTitleIndex === index ? (
              <input
                autoFocus
                type="text"
                defaultValue={title}
                onBlur={(e) => updateTabTitle(index, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') updateTabTitle(index, e.currentTarget.value);
                  if (e.key === 'Escape') setEditingTitleIndex(null);
                }}
                className="bg-white border border-[var(--color-accent)] rounded px-1 py-0 text-xs w-24 outline-none text-black"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span onDoubleClick={() => setEditingTitleIndex(index)} className="whitespace-nowrap truncate max-w-[150px]">
                {title}
              </span>
            )}
            
            {titles.length > 1 && (
               <div
                 onClick={(e) => removeTab(e, index)}
                 className="p-0.5 rounded-full hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] hover:text-red-500 transition-colors"
               >
                 <X size={12} />
               </div>
            )}
          </button>
        ))}

        <button
          onClick={handleAddTab}
          className="ml-2 p-1.5 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-colors mb-2"
          title="New Workspace"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Content Workspace */}
      <div className="bg-[var(--color-bg-primary)]">
         <NodeViewContent className="tabs-content-area min-h-[150px] p-4" />
      </div>
    </NodeViewWrapper>
  );
}


