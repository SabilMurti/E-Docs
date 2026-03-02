import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { useState, useEffect, useCallback } from 'react';
import { Check, Trash2 } from 'lucide-react';

export default function StepBlock({ node, editor, getPos, deleteNode }) {
  const [showActions, setShowActions] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [isLast, setIsLast] = useState(false);

  const updateStepInfo = useCallback(() => {
    if (typeof getPos !== 'function') return;
    
    try {
      const pos = getPos();
      const $pos = editor.state.doc.resolve(pos);
      const index = $pos.index();
      const parentNode = $pos.parent;
      
      if (parentNode && parentNode.type.name === 'steps') {
        setStepIndex(index);
        setIsLast(index === parentNode.childCount - 1);
        const completedSteps = parentNode.attrs.completedSteps || [];
        setIsCompleted(!!completedSteps[index]);
      }
    } catch (e) {
      // Ignore errors during update
    }
  }, [getPos, editor]);

  useEffect(() => {
    updateStepInfo();
    const handleUpdate = () => {
      // Small timeout ensures Tiptap has finished layout
      setTimeout(updateStepInfo, 0);
    };
    editor.on('transaction', handleUpdate);
    return () => editor.off('transaction', handleUpdate);
  }, [editor, updateStepInfo]);

  const toggleComplete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (typeof getPos !== 'function') return;
    
    try {
      const pos = getPos();
      const $pos = editor.state.doc.resolve(pos);
      const index = $pos.index();
      const parentPos = $pos.before();
      const parentNode = $pos.parent;
      
      if (parentNode && parentNode.type.name === 'steps') {
        const completedSteps = [...(parentNode.attrs.completedSteps || [])];
        completedSteps[index] = !completedSteps[index];
        
        const tr = editor.state.tr;
        tr.setNodeMarkup(parentPos, null, {
          ...parentNode.attrs,
          completedSteps
        });
        editor.view.dispatch(tr);
      }
    } catch (err) {
      console.error('Toggle complete error:', err);
    }
  };

  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (typeof getPos !== 'function') return;
    
    try {
      const pos = getPos();
      const $pos = editor.state.doc.resolve(pos);
      const parentNode = $pos.parent;
      const parentPos = $pos.before();
      
      if (parentNode && parentNode.type.name === 'steps' && parentNode.childCount <= 1) {
        // If it's the last remaining step, delete the entire steps block to prevent schema errors
        editor.commands.deleteRange({ from: parentPos, to: parentPos + parentNode.nodeSize });
        return;
      }
      
      // Delete just this step
      editor.commands.deleteRange({ from: pos, to: pos + node.nodeSize });
    } catch (err) {
      console.error('Delete step error:', err);
      if (typeof deleteNode === 'function') deleteNode();
    }
  };

  return (
    <NodeViewWrapper 
      className="step-item"
      data-completed={isCompleted}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="step-timeline" contentEditable={false}>
        <button
          onClick={toggleComplete}
          className={`step-checkbox ${isCompleted ? 'completed' : ''}`}
          title={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
        >
          {isCompleted ? (
            <Check size={14} strokeWidth={3} />
          ) : (
            <span className="step-number">{stepIndex + 1}</span>
          )}
        </button>
        {!isLast && <div className="step-connector" />}
      </div>

      <div className={`step-content ${isCompleted ? 'completed' : ''}`}>
        <NodeViewContent className="step-content-inner" />
      </div>

      <div className={`step-actions ${showActions ? 'visible' : ''}`} contentEditable={false}>
        <button
          onClick={handleDelete}
          className="step-action-btn step-delete-btn"
          title="Delete step"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </NodeViewWrapper>
  );
}
