import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { useState, useEffect, useRef } from 'react';
import { Plus, X } from 'lucide-react';

export function TabsView({ node, updateAttributes, editor, getPos }) {
  const [editingTitleIndex, setEditingTitleIndex] = useState(null);
  const activeTab = node.attrs.activeTab ?? 0;
  const [titles, setTitles] = useState([]);
  const tabBarRef = useRef(null);

  // Sync titles from node content
  useEffect(() => {
    const t = [];
    node.content.forEach((child) => t.push(child.attrs.title || 'New Tab'));
    setTitles(t);
  }, [node.content]);

  // Scroll active tab into view
  useEffect(() => {
    const el = tabBarRef.current?.querySelector('.tab-active');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [activeTab]);

  // Switch active tab — updates both tabs.activeTab AND each tabItem.isActive
  const switchTab = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    if (!editor || editor.isDestroyed) return;
    if (editingTitleIndex !== null) return;

    try {
      const pos = getPos();
      if (typeof pos !== 'number') return;
      const { tr, doc } = editor.state;
      const tabsNode = doc.nodeAt(pos);
      if (!tabsNode) return;

      // Update tabs container's activeTab attr
      tr.setNodeMarkup(pos, null, { ...tabsNode.attrs, activeTab: index });

      // Update each tabItem's isActive attr
      let tabPos = pos + 1;
      tabsNode.forEach((child, _, i) => {
        tr.setNodeMarkup(tabPos, null, { ...child.attrs, isActive: i === index });
        tabPos += child.nodeSize;
      });

      editor.view.dispatch(tr);
    } catch (err) {
      console.error('Switch tab failed:', err);
    }
  };

  // Add a new tab
  const handleAddTab = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!editor || editor.isDestroyed) return;

    try {
      const pos = getPos();
      if (typeof pos !== 'number') return;
      const { tr, doc, schema } = editor.state;
      const tabsNode = doc.nodeAt(pos);
      if (!tabsNode) return;

      const newIndex = tabsNode.childCount;
      const insertPos = pos + tabsNode.nodeSize - 1;

      const newTab = schema.nodes.tabItem.create(
        { title: `Tab ${newIndex + 1}`, isActive: false },
        schema.nodes.paragraph.create()
      );
      tr.insert(insertPos, newTab);

      // Also update tabs.activeTab and mark all tabs as inactive except new one
      // We can't do both setNodeMarkup + insert easily on same node, so just insert
      // and switch afterwards
      editor.view.dispatch(tr);

      // Switch to new tab after the node is in the doc
      setTimeout(() => {
        try {
          const pos2 = getPos();
          if (typeof pos2 !== 'number') return;
          const { tr: tr2, doc: doc2 } = editor.state;
          const tabsNode2 = doc2.nodeAt(pos2);
          if (!tabsNode2) return;

          tr2.setNodeMarkup(pos2, null, { ...tabsNode2.attrs, activeTab: newIndex });
          let p = pos2 + 1;
          tabsNode2.forEach((child, _, i) => {
            tr2.setNodeMarkup(p, null, { ...child.attrs, isActive: i === newIndex });
            p += child.nodeSize;
          });
          editor.view.dispatch(tr2);
        } catch (_) {}
      }, 30);

    } catch (err) {
      console.error('Add tab failed:', err);
    }
  };

  // Update tab title
  const updateTabTitle = (index, newTitle) => {
    if (!editor || editor.isDestroyed) return;
    try {
      const pos = getPos();
      if (typeof pos !== 'number') return;
      const { tr, doc } = editor.state;
      const tabsNode = doc.nodeAt(pos);
      if (!tabsNode) return;

      let tabPos = pos + 1;
      for (let i = 0; i < index; i++) tabPos += tabsNode.child(i).nodeSize;

      tr.setNodeMarkup(tabPos, null, { ...tabsNode.child(index).attrs, title: newTitle });
      editor.view.dispatch(tr);
    } catch (err) {
      console.error('Update title failed:', err);
    }
    setEditingTitleIndex(null);
  };

  // Remove a tab
  const removeTab = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    if (titles.length <= 1 || !editor || editor.isDestroyed) return;

    try {
      const pos = getPos();
      if (typeof pos !== 'number') return;
      const { tr, doc } = editor.state;
      const tabsNode = doc.nodeAt(pos);
      if (!tabsNode) return;

      let tabPos = pos + 1;
      for (let i = 0; i < index; i++) tabPos += tabsNode.child(i).nodeSize;

      const child = tabsNode.child(index);
      tr.delete(tabPos, tabPos + child.nodeSize);

      const newActive = activeTab >= index ? Math.max(0, activeTab - 1) : activeTab;
      tr.setNodeMarkup(pos, null, { ...tabsNode.attrs, activeTab: newActive });

      editor.view.dispatch(tr);

      // Re-mark isActive after deletion
      setTimeout(() => {
        try {
          const pos2 = getPos();
          if (typeof pos2 !== 'number') return;
          const { tr: tr2, doc: doc2 } = editor.state;
          const n2 = doc2.nodeAt(pos2);
          if (!n2) return;
          let p = pos2 + 1;
          n2.forEach((c, _, i) => {
            tr2.setNodeMarkup(p, null, { ...c.attrs, isActive: i === newActive });
            p += c.nodeSize;
          });
          editor.view.dispatch(tr2);
        } catch (_) {}
      }, 30);

    } catch (err) {
      console.error('Remove tab failed:', err);
    }
  };

  return (
    <NodeViewWrapper className="premium-tabs-workspace my-12 relative rounded-2xl border border-[var(--color-border-primary)] shadow-xl bg-[var(--color-bg-primary)] transition-all duration-500 hover:shadow-2xl">
      {/* Tab bar */}
      <div
        ref={tabBarRef}
        className="flex items-center gap-1 bg-[var(--color-bg-secondary)] px-3 pt-3 h-14 border-b border-[var(--color-border-secondary)] overflow-x-auto no-scrollbar scroll-smooth"
      >
        <div className="flex items-center gap-1 bg-[var(--color-bg-tertiary)] p-1 rounded-xl shrink-0">
          {titles.map((title, index) => {
            const isActive = index === activeTab;
            return (
              <div
                key={index}
                onMouseDown={(e) => switchTab(e, index)}
                onDoubleClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingTitleIndex(index); }}
                className={`
                  tab-item-header relative flex items-center gap-2 px-6 py-2 text-[13px] font-semibold
                  transition-all duration-300 cursor-pointer min-w-[120px] h-[36px] rounded-lg select-none group
                  ${isActive
                    ? 'tab-active bg-[var(--color-bg-primary)] text-[var(--color-accent)] shadow-sm ring-1 ring-[var(--color-border-primary)]'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] opacity-80 hover:opacity-100'
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
                      e.stopPropagation();
                      if (e.key === 'Enter') { e.preventDefault(); updateTabTitle(index, e.currentTarget.value); }
                      if (e.key === 'Escape') setEditingTitleIndex(null);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-transparent border-none w-full outline-none text-[13px] font-semibold text-[var(--color-text-primary)] text-center"
                  />
                ) : (
                  <span className="truncate flex-1 text-center pointer-events-none">{title}</span>
                )}

                {titles.length > 1 && (
                  <div
                    onMouseDown={(e) => removeTab(e, index)}
                    className={`p-1 rounded-md transition-all duration-200 ${
                      isActive
                        ? 'text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'
                        : 'opacity-0 group-hover:opacity-100 text-[var(--color-text-muted)] hover:text-red-500'
                    }`}
                  >
                    <X size={12} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button
          onMouseDown={handleAddTab}
          className="p-2 ml-2 rounded-xl text-[var(--color-text-muted)] hover:bg-[var(--color-accent-light)] hover:text-[var(--color-accent)] transition-all duration-300 active:scale-90 shrink-0"
          title="Add new tab"
        >
          <Plus size={18} strokeWidth={2.5} />
        </button>
      </div>

      {/* Tab content rendered by TabItemView nodes */}
      <div className="bg-[var(--color-bg-primary)] relative">
        <NodeViewContent className="premium-tab-content p-8 md:p-12 min-h-[250px]" />
      </div>
    </NodeViewWrapper>
  );
}
