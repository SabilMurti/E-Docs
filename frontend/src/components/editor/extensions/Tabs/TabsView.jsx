import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { useState, useEffect, useRef } from 'react';
import { Plus, X } from 'lucide-react';

export function TabsView({ node, updateAttributes, editor, getPos }) {
  const [editingTitleIndex, setEditingTitleIndex] = useState(null);
  const activeTab = node.attrs.activeTab ?? 0;
  const [titles, setTitles] = useState([]);
  const tabBarRef = useRef(null);
  const isUpdatingRef = useRef(false);

  useEffect(() => {
    const currentTitles = [];
    node.content.forEach((child) => {
      currentTitles.push(child.attrs.title || 'New Tab');
    });
    setTitles(currentTitles);
  }, [node.content]);

  useEffect(() => {
    if (tabBarRef.current) {
      const activeElement = tabBarRef.current.querySelector('.tab-active');
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeTab]);

  const handleTabClick = (index) => {
    if (!editor || editor.isDestroyed || isUpdatingRef.current) return;
    if (editingTitleIndex !== null) return;

    // Just update the activeTab attribute - TabItemView handles showing/hiding
    updateAttributes({ activeTab: index });
  };

  const handleDoubleClick = (e, index) => {
    e.stopPropagation();
    e.preventDefault();
    setEditingTitleIndex(index);
  };

  const handleAddTab = () => {
    if (!editor || editor.isDestroyed || isUpdatingRef.current) return;
    
    isUpdatingRef.current = true;
    
    try {
      const pos = getPos();
      if (typeof pos !== 'number') return;

      const { tr, schema, doc } = editor.state;
      const tabsNode = doc.nodeAt(pos);
      if (!tabsNode) return;

      // Insert position is at the end of the tabs node
      const insertPos = pos + tabsNode.nodeSize - 1;
      
      const newTab = schema.nodes.tabItem.create({
        title: `Tab ${tabsNode.childCount + 1}`,
        isActive: false
      }, schema.nodes.paragraph.create());

      // Just insert the new tab - don't try to switch to it
      tr.insert(insertPos, newTab);
      editor.view.dispatch(tr);
      
    } catch (error) {
      console.error('Failed to add tab:', error);
    } finally {
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 100);
    }
  };

  const updateTabTitle = (index, newTitle) => {
    if (editingTitleIndex === null || !editor || editor.isDestroyed) return;
    
    try {
      const pos = getPos();
      if (typeof pos !== 'number') return;

      const { tr, doc } = editor.state;
      const tabsNode = doc.nodeAt(pos);
      if (!tabsNode) return;

      // Calculate position of the tab to update
      let tabPos = pos + 1;
      for (let i = 0; i < index; i++) {
        tabPos += tabsNode.child(i).nodeSize;
      }

      const child = tabsNode.child(index);
      tr.setNodeMarkup(tabPos, null, {
        ...child.attrs,
        title: newTitle
      });

      editor.view.dispatch(tr);
    } catch (error) {
      console.error('Failed to update title:', error);
    }
    
    setEditingTitleIndex(null);
  };

  const removeTab = (e, index) => {
    e.stopPropagation();
    if (titles.length <= 1 || !editor || editor.isDestroyed || isUpdatingRef.current) return;
    
    isUpdatingRef.current = true;
    
    try {
      const pos = getPos();
      if (typeof pos !== 'number') return;

      const { tr, doc } = editor.state;
      const tabsNode = doc.nodeAt(pos);
      if (!tabsNode) return;

      // Calculate position of the tab to delete
      let tabPos = pos + 1;
      for (let i = 0; i < index; i++) {
        tabPos += tabsNode.child(i).nodeSize;
      }

      const child = tabsNode.child(index);
      tr.delete(tabPos, tabPos + child.nodeSize);

      // Adjust activeTab if needed
      const newActiveTab = activeTab >= index ? Math.max(0, activeTab - 1) : activeTab;
      if (newActiveTab !== activeTab) {
        // Need to get the updated node after deletion
        tr.setNodeMarkup(pos, null, {
          ...tabsNode.attrs,
          activeTab: newActiveTab
        });
      }

      editor.view.dispatch(tr);
    } catch (error) {
      console.error('Failed to remove tab:', error);
    } finally {
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 100);
    }
  };

  return (
    <NodeViewWrapper className="premium-tabs-workspace my-12 relative rounded-2xl border border-[var(--color-border-primary)] shadow-xl bg-[var(--color-bg-primary)] transition-all duration-500 hover:shadow-2xl">
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
                  tab-item-header relative flex items-center gap-2 px-6 py-2 text-[13px] font-semibold transition-all duration-300 cursor-pointer min-w-[120px] h-[36px] rounded-lg select-none group
                  ${isActive ? 'tab-active bg-[var(--color-bg-primary)] text-[var(--color-accent)] shadow-sm scale-100 ring-1 ring-[var(--color-border-primary)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] scale-95 opacity-80 hover:opacity-100'}
                `}
              >
                {editingTitleIndex === index ? (
                  <input
                    autoFocus
                    type="text"
                    defaultValue={title}
                    onBlur={(e) => updateTabTitle(index, e.target.value)}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        updateTabTitle(index, e.currentTarget.value);
                      }
                      if (e.key === 'Escape') {
                        setEditingTitleIndex(null);
                      }
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
                    className={`p-1 rounded-md transition-all duration-200 ${isActive ? 'text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10' : 'opacity-0 group-hover:opacity-100 text-[var(--color-text-muted)] hover:text-red-500'}`}
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

      <div className="bg-[var(--color-bg-primary)] relative">
        <NodeViewContent className="premium-tab-content p-8 md:p-12 min-h-[250px]" />
      </div>
    </NodeViewWrapper>
  );
}
