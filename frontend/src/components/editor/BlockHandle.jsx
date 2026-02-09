import { useState, useEffect, useRef } from 'react';
import { Plus, GripVertical, Trash2, Copy, ArrowUp, ArrowDown } from 'lucide-react';
import { BLOCK_DEFINITIONS } from './BlockDefinitions';

export default function BlockHandle({ 
  editor, 
  containerRef 
}) {
  const [menuState, setMenuState] = useState({ 
    top: 0, 
    visible: false, 
    pos: 0 
  });
  const [activeDropdown, setActiveDropdown] = useState(null); // 'add' | 'options' | null
  const menuRef = useRef(null);

  // Track mouse to position the handle
  useEffect(() => {
    if (!editor || !containerRef?.current) return;

    const container = containerRef.current;

    const handleMouseMove = (e) => {
      if (activeDropdown) return;

      // Find block under cursor
      let target = document.elementFromPoint(e.clientX, e.clientY);
      let block = target?.closest('.ProseMirror > *');

      // If hovering in gutter, try to find nearest block
      if (!block) {
        const editorRect = editor.view.dom.getBoundingClientRect();
        const textX = editorRect.left + 100;
        
        const posResult = editor.view.posAtCoords({ left: textX, top: e.clientY });
        if (posResult) {
          let node = editor.view.domAtPos(posResult.pos).node;
          if (node.nodeType === 3) node = node.parentNode;
          block = node.closest('.ProseMirror > *');
        }
      }

      if (block) {
        const view = editor.view;
        const editorDom = view.dom;
        const coords = block.getBoundingClientRect();
        const editorCoords = editorDom.getBoundingClientRect();
        const top = coords.top - editorCoords.top + editorDom.scrollTop;
        const pos = view.posAtDOM(block, 0);
        
        setMenuState({
          top: top,
          visible: true,
          pos
        });
      } else {
        if (!menuRef.current?.contains(e.target)) {
          setMenuState(prev => ({ ...prev, visible: false }));
        }
      }
    };

    const handleMouseLeave = () => {
      if (!activeDropdown) {
        setMenuState(prev => ({ ...prev, visible: false }));
      }
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [editor, activeDropdown, containerRef]);

  if (!editor) return null;

  const handleInsertBlock = (action) => {
    if (menuState.pos !== null) {
      // Move to end of current block
      const nodeSize = editor.state.doc.nodeAt(menuState.pos)?.nodeSize || 0;
      editor.chain().setTextSelection(menuState.pos + nodeSize).focus().run();
    }
    action(editor);
    setActiveDropdown(null);
  };

  const handleBlockAction = (actionFn) => {
    if (menuState.pos !== null) {
      editor.commands.setTextSelection(menuState.pos);
    }
    actionFn();
    setActiveDropdown(null);
  };

  return (
    <div
      ref={menuRef}
      className="absolute left-2 z-40 transition-opacity duration-100"
      style={{
        top: `${menuState.top}px`,
        opacity: menuState.visible || activeDropdown ? 1 : 0,
        pointerEvents: menuState.visible || activeDropdown ? 'auto' : 'none'
      }}
      onMouseLeave={(e) => {
        if (containerRef?.current?.contains(e.relatedTarget)) return;
        if (!activeDropdown) setMenuState(prev => ({ ...prev, visible: false }));
      }}
    >
      <div className="block-handle visible flex items-center gap-0.5">
        {/* Plus Button */}
        <div className="relative">
          <button
            onClick={() => setActiveDropdown(activeDropdown === 'add' ? null : 'add')}
            className={`block-handle-btn ${activeDropdown === 'add' ? 'bg-[color:var(--color-bg-hover)]' : ''}`}
            title="Add block"
          >
            <Plus size={14} />
          </button>

          {activeDropdown === 'add' && (
            <BlockMenuDropdown 
              onClose={() => setActiveDropdown(null)} 
              onSelect={handleInsertBlock} 
            />
          )}
        </div>

        {/* Grip Button */}
        <div className="relative">
          <button
            onClick={() => setActiveDropdown(activeDropdown === 'options' ? null : 'options')}
            className={`block-handle-btn cursor-grab ${activeDropdown === 'options' ? 'bg-[color:var(--color-bg-hover)]' : ''}`}
            title="Block options"
          >
            <GripVertical size={14} />
          </button>

          {activeDropdown === 'options' && (
            <BlockOptionsDropdown 
              onClose={() => setActiveDropdown(null)} 
              onSelect={handleBlockAction}
              editor={editor}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Block Menu Dropdown (for + button)
function BlockMenuDropdown({ onClose, onSelect }) {
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.block-menu-dropdown')) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div className="block-menu-dropdown editor-menu absolute top-8 left-0 w-72 animate-scaleIn">
      <div className="editor-menu-header">
        Insert block
      </div>
      <div className="p-1 overflow-y-auto max-h-80">
        {BLOCK_DEFINITIONS.map((group, gIndex) => (
          <div key={group.category}>
            {gIndex > 0 && (
              <div className="mx-2 my-1 border-t border-[color:var(--color-border-secondary)]" />
            )}
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[color:var(--color-text-muted)]">
              {group.category}
            </div>
            {group.items.slice(0, 5).map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelect(item.action)}
                  className="editor-menu-item"
                >
                  <div className="editor-menu-item-icon">
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="editor-menu-item-label">{item.name}</div>
                    <div className="editor-menu-item-description truncate">
                      {item.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// Block Options Dropdown (for grip button)
function BlockOptionsDropdown({ onClose, onSelect, editor }) {
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.block-options-dropdown')) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const options = [
    {
      icon: Trash2,
      label: 'Delete',
      action: () => editor.chain().focus().deleteSelection().run()
    },
    {
      icon: Copy,
      label: 'Duplicate',
      action: () => {
        // Simple duplicate by copying and pasting
        const { selection } = editor.state;
        const node = editor.state.doc.nodeAt(selection.from);
        if (node) {
          editor.commands.insertContentAt(selection.to, node.toJSON());
        }
      }
    },
    { divider: true },
    {
      icon: ArrowUp,
      label: 'Move up',
      action: () => {
        // For now, just a placeholder
        console.log('Move up');
      }
    },
    {
      icon: ArrowDown,
      label: 'Move down',
      action: () => {
        console.log('Move down');
      }
    }
  ];

  return (
    <div className="block-options-dropdown editor-menu absolute top-8 left-0 w-44 animate-scaleIn">
      <div className="p-1">
        {options.map((option, index) => {
          if (option.divider) {
            return (
              <div key={index} className="my-1 border-t border-[color:var(--color-border-secondary)]" />
            );
          }
          const Icon = option.icon;
          return (
            <button
              key={index}
              onClick={() => onSelect(option.action)}
              className="editor-menu-item"
            >
              <Icon size={14} className="text-[color:var(--color-text-muted)]" />
              <span className="editor-menu-item-label">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
