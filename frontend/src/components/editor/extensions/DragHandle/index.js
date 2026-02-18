/**
 * DragHandle Extension for Tiptap
 * 
 * Enables drag-and-drop reordering of blocks
 * Now works with CSS-based always-visible handles
 */

import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

const DragHandlePluginKey = new PluginKey('dragHandle');

/**
 * DragHandle Extension
 */
export const DragHandle = Extension.create({
  name: 'dragHandle',
  
  addProseMirrorPlugins() {
    const editor = this.editor;
    
    return [
      new Plugin({
        key: DragHandlePluginKey,
        
        state: {
          init() {
            return {
              dragging: false,
              draggedPos: null,
              draggedNode: null,
              dropPos: null,
            };
          },
          apply(tr, prev) {
            const meta = tr.getMeta(DragHandlePluginKey);
            if (meta) {
              return { ...prev, ...meta };
            }
            return prev;
          },
        },
        
        props: {
          handleDOMEvents: {
            // Detect mousedown on the ::before pseudo element area
            mousedown: (view, event) => {
              const target = event.target;
              
              // Check if clicking in the left margin area (where handles are)
              if (!target.closest('.ProseMirror')) return false;
              
              const block = target.closest('.ProseMirror > *');
              if (!block) return false;

              // Prevent table dragging to avoid layout shifts
              if (block.tagName === 'TABLE' || block.classList.contains('tableWrapper')) return false;
              
              const blockRect = block.getBoundingClientRect();
              const clickX = event.clientX;
              
              // Check if click is in the drag handle area (left 32px)
              if (clickX > blockRect.left + 32) return false;
              
              // Make the block draggable temporarily
              block.setAttribute('draggable', 'true');
              block.classList.add('drag-ready');
              
              const cleanup = () => {
                block.removeAttribute('draggable');
                block.classList.remove('drag-ready');
                document.removeEventListener('mouseup', cleanup);
              };
              
              document.addEventListener('mouseup', cleanup);
              
              return false;
            },
            
            dragstart: (view, event) => {
              const target = event.target;
              const block = target.closest('.ProseMirror > *');
              
              if (!block || !block.classList.contains('drag-ready')) {
                return false;
              }
              
              const pos = view.posAtDOM(block, 0);
              if (pos === null) return false;
              
              const node = view.state.doc.nodeAt(pos);
              if (!node) {
                // Try to get the parent node
                const $pos = view.state.doc.resolve(pos);
                const parentNode = $pos.parent;
                if (!parentNode) return false;
              }
              
              // Get the actual node at this position
              const $pos = view.state.doc.resolve(pos);
              const nodeAtPos = view.state.doc.nodeAt(pos) || $pos.parent;
              
              // Store drag data
              event.dataTransfer.effectAllowed = 'move';
              event.dataTransfer.setData('text/plain', 'block');
              
              // Visual feedback
              block.classList.add('is-dragging');
              
              // Set plugin state
              view.dispatch(
                view.state.tr.setMeta(DragHandlePluginKey, {
                  dragging: true,
                  draggedPos: pos,
                  draggedNode: nodeAtPos,
                })
              );
              
              return true;
            },
            
            dragend: (view, event) => {
              // Clean up all dragging states
              const blocks = view.dom.querySelectorAll('.is-dragging, .drag-ready');
              blocks.forEach(b => {
                b.classList.remove('is-dragging', 'drag-ready');
                b.removeAttribute('draggable');
              });
              
              // Remove drop indicators
              const indicators = document.querySelectorAll('.block-drop-indicator');
              indicators.forEach(el => el.remove());
              
              view.dispatch(
                view.state.tr.setMeta(DragHandlePluginKey, {
                  dragging: false,
                  draggedPos: null,
                  draggedNode: null,
                  dropPos: null,
                })
              );
              
              return false;
            },
            
            dragover: (view, event) => {
              const state = DragHandlePluginKey.getState(view.state);
              if (!state.dragging) return false;
              
              event.preventDefault();
              event.dataTransfer.dropEffect = 'move';
              
              // Find block under cursor for drop indicator
              const target = document.elementFromPoint(event.clientX, event.clientY);
              const block = target?.closest('.ProseMirror > *');
              
              // Remove existing indicators
              document.querySelectorAll('.block-drop-indicator').forEach(el => el.remove());
              
              if (block && !block.classList.contains('is-dragging')) {
                const rect = block.getBoundingClientRect();
                const midY = rect.top + rect.height / 2;
                const isAbove = event.clientY < midY;
                
                // Create drop indicator
                const indicator = document.createElement('div');
                indicator.className = 'block-drop-indicator';
                indicator.style.cssText = `
                  position: fixed;
                  left: ${rect.left}px;
                  right: ${window.innerWidth - rect.right}px;
                  width: ${rect.width}px;
                  top: ${isAbove ? rect.top - 2 : rect.bottom + 2}px;
                  height: 4px;
                  background: var(--color-accent);
                  border-radius: 2px;
                  pointer-events: none;
                  z-index: 9999;
                `;
                document.body.appendChild(indicator);
              }
              
              return true;
            },
            
            dragleave: (view, event) => {
              // Only remove if leaving the editor entirely
              if (!view.dom.contains(event.relatedTarget)) {
                document.querySelectorAll('.block-drop-indicator').forEach(el => el.remove());
              }
              return false;
            },
            
            drop: (view, event) => {
              const state = DragHandlePluginKey.getState(view.state);
              if (!state.dragging) return false;
              
              event.preventDefault();
              
              // Remove drop indicators
              document.querySelectorAll('.block-drop-indicator').forEach(el => el.remove());
              
              const { draggedPos, draggedNode } = state;
              if (draggedPos === null || !draggedNode) return false;
              
              // Find drop position
              const dropPosResult = view.posAtCoords({
                left: event.clientX,
                top: event.clientY,
              });
              
              if (!dropPosResult) return false;
              
              // Find the block at drop position
              const target = document.elementFromPoint(event.clientX, event.clientY);
              const dropBlock = target?.closest('.ProseMirror > *');
              
              if (!dropBlock) return false;
              
              const dropBlockPos = view.posAtDOM(dropBlock, 0);
              if (dropBlockPos === null) return false;
              
              // Calculate if dropping above or below
              const dropRect = dropBlock.getBoundingClientRect();
              const isAbove = event.clientY < dropRect.top + dropRect.height / 2;
              
              // Get node size
              const nodeSize = draggedNode.nodeSize;
              
              // Don't drop at the same position
              if (dropBlockPos >= draggedPos && dropBlockPos <= draggedPos + nodeSize) {
                return false;
              }
              
              // Calculate target position
              let targetPos;
              const $dropPos = view.state.doc.resolve(dropBlockPos);
              const dropNode = view.state.doc.nodeAt(dropBlockPos);
              
              if (isAbove) {
                targetPos = dropBlockPos;
              } else {
                targetPos = dropBlockPos + (dropNode?.nodeSize || 1);
              }
              
              // Perform the move
              const tr = view.state.tr;
              
              // Delete from original position first
              tr.delete(draggedPos, draggedPos + nodeSize);
              
              // Adjust target position if it was after the deleted content
              if (targetPos > draggedPos) {
                targetPos -= nodeSize;
              }
              
              // Insert at new position
              tr.insert(targetPos, draggedNode);
              
              // Apply transaction
              view.dispatch(tr);
              
              return true;
            },
          },
        },
      }),
    ];
  },
  
  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading', 'bulletList', 'orderedList', 'taskList', 'blockquote', 'codeBlock', 'callout', 'horizontalRule'],
        attributes: {
          dataDraggable: {
            default: 'true',
            renderHTML: () => ({
              'data-block': 'true',
            }),
          },
        },
      },
    ];
  },
});

export default DragHandle;
