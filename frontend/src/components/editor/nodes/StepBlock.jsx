import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { useState, useEffect, useCallback } from 'react';
import { Check, Trash2 } from 'lucide-react';

export default function StepBlock({ node, editor, getPos, deleteNode }) {
  const [showActions, setShowActions] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [isLast, setIsLast] = useState(false);

  const updateStepInfo = useCallback(() => {
    if (!getPos) return;
    
    try {
      const pos = getPos();
      const doc = editor.state.doc;
      
      doc.descendants((n, nPos) => {
        if (n.type.name === 'steps') {
          let idx = 0;
          n.forEach((child, offset) => {
            const childPos = nPos + offset + 1;
            if (childPos === pos) {
              setStepIndex(idx);
              setIsLast(idx === n.childCount - 1);
              const completedSteps = n.attrs.completedSteps || [];
              setIsCompleted(!!completedSteps[idx]);
            }
            idx++;
          });
        }
      });
    } catch (e) {
      // Ignore errors during update
    }
  }, [getPos, editor]);

  useEffect(() => {
    updateStepInfo();
    const updateHandler = () => updateStepInfo();
    editor.on('update', updateHandler);
    return () => editor.off('update', updateHandler);
  }, [editor, updateStepInfo]);

  const toggleComplete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!getPos) return;
    
    try {
      const pos = getPos();
      const doc = editor.state.doc;
      
      doc.descendants((n, nPos) => {
        if (n.type.name === 'steps' && nPos < pos) {
          let idx = 0;
          let found = false;
          n.forEach((child, offset) => {
            const childPos = nPos + offset + 1;
            if (childPos === pos && !found) {
              found = true;
              const completedSteps = [...(n.attrs.completedSteps || [])];
              completedSteps[idx] = !completedSteps[idx];
              
              const tr = editor.state.tr;
              tr.setNodeMarkup(nPos, null, {
                ...n.attrs,
                completedSteps
              });
              editor.view.dispatch(tr);
            }
            idx++;
          });
        }
      });
    } catch (err) {
      console.error('Toggle complete error:', err);
    }
  };

  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!getPos) return;
    
    try {
      const pos = getPos();
      const doc = editor.state.doc;
      
      doc.descendants((n, nPos) => {
        if (n.type.name === 'steps' && nPos < pos) {
          if (n.childCount <= 1) return;
        }
      });
      
      deleteNode();
    } catch (err) {
      console.error('Delete step error:', err);
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
