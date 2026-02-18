/**
 * BlockMenu - Block operations dropdown
 * Shows when hovering over blocks or clicking the grip handle
 */

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus, GripVertical, Trash2, Copy, ArrowUp, ArrowDown,
  Type, Heading1, Heading2, Heading3, List, ListOrdered,
  CheckSquare, Quote, Code2
} from 'lucide-react';
import { 
  moveBlockUp, 
  moveBlockDown, 
  duplicateBlock, 
  deleteBlock,
  transformBlock 
} from '../utils/blockOperations';

// Transform options
const TRANSFORM_OPTIONS = [
  { id: 'paragraph', name: 'Text', icon: Type, 
    action: (editor) => transformBlock(editor, 'paragraph') },
  { id: 'heading1', name: 'Heading 1', icon: Heading1,
    action: (editor) => transformBlock(editor, 'heading', { level: 1 }) },
  { id: 'heading2', name: 'Heading 2', icon: Heading2,
    action: (editor) => transformBlock(editor, 'heading', { level: 2 }) },
  { id: 'heading3', name: 'Heading 3', icon: Heading3,
    action: (editor) => transformBlock(editor, 'heading', { level: 3 }) },
  { id: 'bulletList', name: 'Bullet List', icon: List,
    action: (editor) => transformBlock(editor, 'bulletList') },
  { id: 'orderedList', name: 'Numbered List', icon: ListOrdered,
    action: (editor) => transformBlock(editor, 'orderedList') },
  { id: 'taskList', name: 'Task List', icon: CheckSquare,
    action: (editor) => transformBlock(editor, 'taskList') },
  { id: 'quote', name: 'Quote', icon: Quote,
    action: (editor) => transformBlock(editor, 'blockquote') },
  { id: 'codeBlock', name: 'Code Block', icon: Code2,
    action: (editor) => transformBlock(editor, 'codeBlock') },
];

export default function BlockMenu({ 
  editor, 
  position, 
  onClose,
  onAddBlock 
}) {
  const [showTransform, setShowTransform] = useState(false);
  const menuRef = useRef(null);
  
  // Close on click outside
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);
  
  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);
  
  const handleAction = (action) => {
    action();
    onClose();
  };
  
  const menuItems = [
    { 
      icon: Trash2, 
      label: 'Delete', 
      shortcut: 'Del',
      action: () => handleAction(() => deleteBlock(editor)),
      danger: true
    },
    { 
      icon: Copy, 
      label: 'Duplicate', 
      shortcut: 'Ctrl+D',
      action: () => handleAction(() => duplicateBlock(editor))
    },
    { divider: true },
    { 
      icon: ArrowUp, 
      label: 'Move up', 
      shortcut: 'Ctrl+↑',
      action: () => handleAction(() => moveBlockUp(editor))
    },
    { 
      icon: ArrowDown, 
      label: 'Move down', 
      shortcut: 'Ctrl+↓',
      action: () => handleAction(() => moveBlockDown(editor))
    },
  ];
  
  return createPortal(
    <div
      ref={menuRef}
      className="block-menu fixed z-[9999] bg-[color:var(--color-bg-elevated)] border border-[color:var(--color-border-primary)] rounded-xl shadow-xl overflow-hidden animate-scaleIn"
      style={{ top: position.top, left: position.left }}
    >
      {/* Main Menu */}
      {!showTransform ? (
        <div className="w-48 p-1">
          {menuItems.map((item, index) => {
            if (item.divider) {
              return (
                <div 
                  key={index} 
                  className="my-1 mx-2 border-t border-[color:var(--color-border-secondary)]" 
                />
              );
            }
            
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={item.action}
                className={`
                  w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors
                  hover:bg-[color:var(--color-bg-hover)]
                  ${item.danger ? 'text-[color:var(--color-error)] hover:bg-[color:var(--color-error-light)]' : ''}
                `}
              >
                <Icon size={14} className={item.danger ? '' : 'text-[color:var(--color-text-muted)]'} />
                <span className="flex-1 text-sm">{item.label}</span>
                {item.shortcut && (
                  <span className="text-[10px] text-[color:var(--color-text-muted)] font-mono">
                    {item.shortcut}
                  </span>
                )}
              </button>
            );
          })}
          
          {/* Transform Button */}
          <div className="my-1 mx-2 border-t border-[color:var(--color-border-secondary)]" />
          <button
            onClick={() => setShowTransform(true)}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors hover:bg-[color:var(--color-bg-hover)]"
          >
            <Type size={14} className="text-[color:var(--color-text-muted)]" />
            <span className="flex-1 text-sm">Turn into...</span>
            <span className="text-[color:var(--color-text-muted)]">→</span>
          </button>
        </div>
      ) : (
        /* Transform Submenu */
        <div className="w-48 p-1">
          <button
            onClick={() => setShowTransform(false)}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors hover:bg-[color:var(--color-bg-hover)] mb-1"
          >
            <span className="text-[color:var(--color-text-muted)]">←</span>
            <span className="text-sm text-[color:var(--color-text-muted)]">Back</span>
          </button>
          
          <div className="my-1 mx-2 border-t border-[color:var(--color-border-secondary)]" />
          
          {TRANSFORM_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                onClick={() => {
                  option.action(editor);
                  onClose();
                }}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors hover:bg-[color:var(--color-bg-hover)]"
              >
                <Icon size={14} className="text-[color:var(--color-text-muted)]" />
                <span className="text-sm">{option.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>,
    document.body
  );
}

/**
 * BlockHandle - The floating +/grip buttons next to blocks
 */
export function BlockHandle({ 
  editor, 
  containerRef 
}) {
  const [handleState, setHandleState] = useState({ 
    visible: false, 
    top: 0, 
    pos: 0,
    blockNode: null
  });
  const [activeMenu, setActiveMenu] = useState(null); // 'add' | 'options' | null
  const [isDragging, setIsDragging] = useState(false);
  const [dropIndicator, setDropIndicator] = useState(null);
  const handleRef = useRef(null);
  const dragDataRef = useRef(null);
  
  // Track mouse to position the handle
  useEffect(() => {
    if (!editor || !containerRef?.current) return;
    
    const container = containerRef.current;
    
    const handleMouseMove = (e) => {
      if (activeMenu || isDragging) return; // Don't move when menu is open or dragging
      
      // Find block under cursor
      let target = document.elementFromPoint(e.clientX, e.clientY);
      let block = target?.closest('.ProseMirror > *');
      
      // If hovering in gutter area, try to find nearest block
      if (!block && target?.closest('.page-editor')) {
        const editorEl = editor.view.dom;
        const editorRect = editorEl.getBoundingClientRect();
        const posResult = editor.view.posAtCoords({ 
          left: editorRect.left + 60, 
          top: e.clientY 
        });
        
        if (posResult) {
          let node = editor.view.domAtPos(posResult.pos).node;
          if (node.nodeType === Node.TEXT_NODE) node = node.parentNode;
          block = node?.closest('.ProseMirror > *');
        }
      }
      
      if (block) {
        const blockRect = block.getBoundingClientRect();
        const editorRect = editor.view.dom.getBoundingClientRect();
        const top = blockRect.top - editorRect.top + editor.view.dom.scrollTop;
        const pos = editor.view.posAtDOM(block, 0);
        
        setHandleState({
          visible: true,
          top,
          pos,
          blockNode: block
        });
      } else {
        if (!handleRef.current?.contains(e.target)) {
          setHandleState(prev => ({ ...prev, visible: false }));
        }
      }
    };
    
    const handleMouseLeave = () => {
      if (!activeMenu && !isDragging) {
        setHandleState(prev => ({ ...prev, visible: false }));
      }
    };
    
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [editor, activeMenu, isDragging, containerRef]);
  
  // Handle drag start
  const handleDragStart = (e) => {
    if (!editor || handleState.pos === undefined) return;
    
    const pos = handleState.pos;
    const $pos = editor.state.doc.resolve(pos);
    let node = editor.state.doc.nodeAt(pos);
    
    // Find the parent block node if we're inside a text node
    if (!node) {
      node = $pos.parent;
    }
    
    if (!node) return;
    
    // Store drag data
    dragDataRef.current = {
      pos: pos,
      node: node,
      nodeSize: node.nodeSize
    };
    
    // Visual feedback
    if (handleState.blockNode) {
      handleState.blockNode.classList.add('is-dragging');
    }
    
    setIsDragging(true);
    
    // Set drag image (optional - make it slightly transparent)
    if (handleState.blockNode) {
      e.dataTransfer.setDragImage(handleState.blockNode, 0, 0);
    }
    
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', 'block');
  };
  
  // Handle drag over (show drop indicator)
  const handleDragOver = (e) => {
    if (!isDragging || !editor) return;
    
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Find the element under the cursor
    const target = document.elementFromPoint(e.clientX, e.clientY);
    const block = target?.closest('.ProseMirror > *');
    
    if (block && block !== handleState.blockNode) {
      const rect = block.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const isAbove = e.clientY < midY;
      
      setDropIndicator({
        top: isAbove ? rect.top : rect.bottom,
        isAbove
      });
    }
  };
  
  // Handle drop
  const handleDrop = (e) => {
    if (!isDragging || !editor || !dragDataRef.current) return;
    
    e.preventDefault();
    
    const { pos: draggedPos, node: draggedNode, nodeSize } = dragDataRef.current;
    
    // Find drop position
    const dropPosResult = editor.view.posAtCoords({
      left: e.clientX,
      top: e.clientY
    });
    
    if (!dropPosResult) {
      handleDragEnd();
      return;
    }
    
    let targetPos = dropPosResult.pos;
    
    // Resolve to get block-level position
    const $target = editor.state.doc.resolve(targetPos);
    targetPos = $target.before($target.depth);
    
    // Don't drop at the same position
    if (targetPos >= draggedPos && targetPos <= draggedPos + nodeSize) {
      handleDragEnd();
      return;
    }
    
    // Perform the move
    const tr = editor.state.tr;
    
    // Delete from original position
    tr.delete(draggedPos, draggedPos + nodeSize);
    
    // Adjust target position if it was after the deleted content
    if (targetPos > draggedPos) {
      targetPos -= nodeSize;
    }
    
    // Insert at new position
    tr.insert(targetPos, draggedNode);
    
    editor.view.dispatch(tr);
    handleDragEnd();
  };
  
  // Handle drag end (cleanup)
  const handleDragEnd = () => {
    // Remove visual feedback
    document.querySelectorAll('.is-dragging').forEach(el => {
      el.classList.remove('is-dragging');
    });
    
    setIsDragging(false);
    setDropIndicator(null);
    dragDataRef.current = null;
  };
  
  // Global drag event listeners
  useEffect(() => {
    if (!isDragging) return;
    
    const handleGlobalDragOver = (e) => handleDragOver(e);
    const handleGlobalDrop = (e) => handleDrop(e);
    const handleGlobalDragEnd = () => handleDragEnd();
    
    document.addEventListener('dragover', handleGlobalDragOver);
    document.addEventListener('drop', handleGlobalDrop);
    document.addEventListener('dragend', handleGlobalDragEnd);
    
    return () => {
      document.removeEventListener('dragover', handleGlobalDragOver);
      document.removeEventListener('drop', handleGlobalDrop);
      document.removeEventListener('dragend', handleGlobalDragEnd);
    };
  }, [isDragging, editor]);
  
  if (!editor) return null;
  
  const showHandle = handleState.visible || activeMenu || isDragging;
  
  return (
    <>
      {/* Drop Indicator */}
      {dropIndicator && (
        <div 
          className="fixed left-0 right-0 h-0.5 bg-[var(--color-accent)] z-50 pointer-events-none"
          style={{ top: dropIndicator.top }}
        >
          <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[var(--color-accent)]" />
        </div>
      )}
      
      <div
        ref={handleRef}
        className="block-handle absolute left-2 z-40"
        style={{
          top: `${handleState.top}px`,
          opacity: showHandle ? 1 : 0,
          pointerEvents: showHandle ? 'auto' : 'none',
          transition: 'opacity 100ms ease'
        }}
        onMouseLeave={(e) => {
          if (!activeMenu && !isDragging && !containerRef?.current?.contains(e.relatedTarget)) {
            setHandleState(prev => ({ ...prev, visible: false }));
          }
        }}
      >
        <div className="flex items-center gap-0.5">
          {/* Add Block Button */}
          <button
            onClick={() => setActiveMenu(activeMenu === 'add' ? null : 'add')}
            className={`
              w-6 h-6 rounded flex items-center justify-center transition-colors
              ${activeMenu === 'add' 
                ? 'bg-[color:var(--color-accent)] text-white' 
                : 'text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-bg-hover)] hover:text-[color:var(--color-text-primary)]'
              }
            `}
            title="Add block"
          >
            <Plus size={14} />
          </button>
          
          {/* Drag Handle / Options Button */}
          <div
            draggable
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onClick={() => {
              // Select the block first
              if (handleState.pos !== undefined) {
                editor.commands.setTextSelection(handleState.pos);
              }
              setActiveMenu(activeMenu === 'options' ? null : 'options');
            }}
            className={`
              w-6 h-6 rounded flex items-center justify-center transition-colors cursor-grab active:cursor-grabbing
              ${activeMenu === 'options' 
                ? 'bg-[color:var(--color-accent)] text-white' 
                : 'text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-bg-hover)] hover:text-[color:var(--color-text-primary)]'
              }
              ${isDragging ? 'bg-[color:var(--color-accent)] text-white' : ''}
            `}
            title="Drag to reorder / Click for options"
            data-drag-handle
          >
            <GripVertical size={14} />
          </div>
        </div>
        
        {/* Block Menu */}
        {activeMenu === 'options' && handleRef.current && (
          <BlockMenu
            editor={editor}
            position={{
              top: handleRef.current.getBoundingClientRect().bottom + 4,
              left: handleRef.current.getBoundingClientRect().left
            }}
            onClose={() => setActiveMenu(null)}
          />
        )}
      </div>
    </>
  );
}

