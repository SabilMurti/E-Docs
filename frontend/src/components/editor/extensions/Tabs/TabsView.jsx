import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { useState, useEffect, useRef } from 'react';
import { Plus, X } from 'lucide-react';

export function TabsView({ node, updateAttributes, editor, getPos }) {
  const [editingTitleIndex, setEditingTitleIndex] = useState(null);
  const activeTab = node.attrs.activeTab ?? 0;
  const [titles, setTitles] = useState([]);
  const tabBarRef = useRef(null);
  const focusTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const currentTitles = [];
    let hasActive = false;
    node.content.forEach((child, i) => {
      currentTitles.push(child.attrs.title || 'New Tab');
      if (child.attrs.isActive) hasActive = true;
    });
    setTitles(currentTitles);

    // Initial activation safety
    // Use a small delay to ensure the editor state has stabilized after mount/load
    if (!hasActive && node.childCount > 0 && editor?.isEditable) {
      const timer = setTimeout(() => {
        try { handleTabClick(0); } catch (e) {}
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [node.content]);

  // Scroll active tab into view
  useEffect(() => {
    if (tabBarRef.current) {
      // The structure is tabBarRef -> div (flex items-center gap-1) -> tab elements
      const activeElement = tabBarRef.current.children[0]?.children[activeTab];
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeTab]);

  const handleTabClick = (index) => {
    if (!editor || !editor.isEditable) return;

    try {
      if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current);
      
      const pos = getPos();
      if (typeof pos !== 'number') return;
      updateAttributes({ activeTab: index });

      const { tr } = editor.state;
      const potentialTabsNode = tr.doc.nodeAt(pos);
      if (!potentialTabsNode || potentialTabsNode.type.name !== 'tabs') return;

      let currentPos = pos + 1;
      potentialTabsNode.content.forEach((child, offset, i) => {
        tr.setNodeMarkup(currentPos + offset, null, {
          ...child.attrs,
          isActive: i === index
        });
      });

      editor.view.dispatch(tr);

      // Focus the editor content, but wait a bit to ensure it's not a double-click
      focusTimeoutRef.current = setTimeout(() => {
        if (editor.isDestroyed || editingTitleIndex !== null) return;
        
        let p = getPos() + 1;
        node.content.forEach((child, i) => {
          if (i === index) {
            editor.chain().focus(p + 1).run();
            return false;
          }
          p += child.nodeSize;
        });
      }, 200);
    } catch (error) {
      console.error('Failed to switch tab:', error);
    }
  };

  const handleDoubleClick = (e, index) => {
    e.stopPropagation();
    e.preventDefault();
    if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current);
    setEditingTitleIndex(index);
  };

  const handleAddTab = () => {
    if (!editor || !editor.isEditable) return;
    
    const nextIndex = titles.length;
    
    // Use the command we just added
    editor.chain()
      .focus()
      .addTab()
      .run();
    
    // Switch to the new tab after a short delay for state sync
    setTimeout(() => {
      handleTabClick(nextIndex);
    }, 50);
  };

  const updateTabTitle = (index, newTitle) => {
    if (editingTitleIndex === null) return;
    
    let pos = getPos() + 1;
    node.content.forEach((child, i) => {
      if (i === index) {
        editor.chain().setNodeSelection(pos).updateAttributes('tabItem', { title: newTitle }).run();
      }
      pos += child.nodeSize;
    });
    setEditingTitleIndex(null);
  };

  const removeTab = (e, index) => {
    e.stopPropagation();
    if (titles.length <= 1) return;
    
    let pos = getPos() + 1;
    node.content.forEach((child, i) => {
      if (i === index) {
        editor.chain().deleteRange({ from: pos, to: pos + child.nodeSize }).run();
        return false;
      }
      pos += child.nodeSize;
    });

    if (activeTab >= index) {
      handleTabClick(Math.max(0, activeTab - 1));
    }
  };

  return (
    <NodeViewWrapper className="premium-tabs-workspace my-12 relative rounded-2xl border border-[var(--color-border-primary)] shadow-xl bg-[var(--color-bg-primary)] transition-all duration-500 hover:shadow-2xl">
      {/* 1. Styled Tab Bar with Horizontal Scroll */}
      <div 
        className="flex items-center gap-1 bg-[var(--color-bg-secondary)] px-3 pt-3 h-14 border-b border-[var(--color-border-secondary)] overflow-x-auto no-scrollbar scroll-smooth"
        ref={tabBarRef}
      >
        <div className="flex items-center gap-1 bg-[var(--color-bg-tertiary)] p-1 rounded-xl shrink-0">
          {titles.map((title, index) => {
            const isActive = index === activeTab;
            
            return (
              <div
                key={index}
                onClick={() => handleTabClick(index)}
                onDoubleClick={(e) => handleDoubleClick(e, index)}
                className={`
                  relative flex items-center gap-2 px-6 py-2 text-[13px] font-semibold transition-all duration-300 cursor-pointer min-w-[120px] h-[36px] rounded-lg select-none group
                  ${isActive 
                    ? 'bg-[var(--color-bg-primary)] text-[var(--color-accent)] shadow-sm scale-100 ring-1 ring-[var(--color-border-primary)]' 
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] scale-95 opacity-80 hover:opacity-100'
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
                    className="bg-transparent border-none w-full outline-none text-[13px] font-semibold text-[var(--color-text-primary)] text-center"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="truncate flex-1 text-center pointer-events-none">
                    {title}
                  </span>
                )}
                
                {titles.length > 1 && (
                   <div
                     onClick={(e) => removeTab(e, index)}
                     className={`p-1 rounded-md transition-all duration-200 ${isActive ? 'text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-50' : 'opacity-0 group-hover:opacity-100 text-[var(--color-text-muted)] hover:text-red-500'}`}
                   >
                     <X size={12} />
                   </div>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={handleAddTab}
          className="p-2 ml-2 rounded-xl text-[var(--color-text-muted)] hover:bg-[var(--color-accent-light)] hover:text-[var(--color-accent)] transition-all duration-300 active:scale-90 shrink-0"
          title="Add new tab"
        >
          <Plus size={18} strokeWidth={2.5} />
        </button>
      </div>

      {/* 2. Content Area */}
      <div className="bg-[var(--color-bg-primary)] relative">
         <NodeViewContent className="premium-tab-content p-8 md:p-12 min-h-[250px] animate-in fade-in slide-in-from-bottom-2 duration-500" />
      </div>
    </NodeViewWrapper>
  );
}
