import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { useState, useRef, useEffect } from 'react';
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  ListChecks,
  Check,
  ArrowDownToLine
} from 'lucide-react';

export default function StepsBlock({ node, updateAttributes, editor, getPos }) {
  const [collapsed, setCollapsed] = useState(false);

  const completedSteps = node.attrs.completedSteps || [];
  const stepCount = node.childCount;
  const completedCount = completedSteps.filter(Boolean).length;
  const progress = stepCount > 0 ? Math.round((completedCount / stepCount) * 100) : 0;

  const toggleStepCompletion = (index, e) => {
    e.stopPropagation();
    e.preventDefault();
    const newCompleted = [...completedSteps];
    newCompleted[index] = !newCompleted[index];
    updateAttributes({ completedSteps: newCompleted });
  };

  const addStep = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const pos = getPos() + node.nodeSize - 1;
    editor.chain().focus().insertContentAt(pos, {
      type: 'step',
      content: [{ type: 'paragraph' }]
    }).run();
  };
  
  const exitSteps = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof getPos !== 'function') return;
    const pos = getPos() + node.nodeSize;
    editor.chain().focus().insertContentAt(pos, { type: 'paragraph' }).run();
  };

  const toggleCollapse = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCollapsed(!collapsed);
  };

  return (
    <NodeViewWrapper className="steps-block-wrapper my-8" data-type="steps">
      <div className="steps-container">
        <div className="steps-header">
          <div className="steps-header-left">
            <div className="steps-icon">
              <ListChecks size={18} />
            </div>
            <div className="steps-header-info">
              <span className="steps-title">Steps</span>
              <span className="steps-progress-text">
                {completedCount} of {stepCount} completed
              </span>
            </div>
          </div>
          
          <div className="steps-header-right">
            <div className="steps-progress-bar-container">
              <div 
                className="steps-progress-bar" 
                style={{ width: `${progress}%` }}
              />
            </div>
            
            <div className="steps-header-actions">
              <button
                onMouseDown={addStep}
                className="steps-action-btn steps-add-btn"
                title="Add step"
              >
                <Plus size={16} />
              </button>
              <button
                onMouseDown={exitSteps}
                className="steps-action-btn"
                title="Exit steps (insert text below)"
              >
                <ArrowDownToLine size={16} />
              </button>
              <button
                onMouseDown={toggleCollapse}
                className="steps-action-btn"
                title={collapsed ? 'Expand' : 'Collapse'}
              >
                {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
              </button>
            </div>
          </div>
        </div>

        {!collapsed && (
          <div className="steps-content" data-step-count={stepCount}>
            <NodeViewContent className="steps-nodes" />
          </div>
        )}
      </div>

      {/* Hidden template for completion state - read by CSS */}
      <style>{`
        .steps-content[data-step-count="${stepCount}"] {
          ${completedSteps.map((c, i) => c ? `--step-${i}-completed: 1;` : '').join(' ')}
        }
      `}</style>
    </NodeViewWrapper>
  );
}
