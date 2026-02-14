import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import React, { useState, useEffect } from 'react';
import { ChevronRight, GripVertical } from 'lucide-react';

export default function ToggleComponent(props) {
  const { node, updateAttributes, getPos } = props;
  const { summary, isOpen } = node.attrs;

  const toggleOpen = () => {
    updateAttributes({ isOpen: !isOpen });
  };

  return (
    <NodeViewWrapper className="toggle-block my-4">
      <div 
        className={`
          border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden transition-all duration-200
          shadow-md hover:shadow-lg hover:border-gray-400 dark:hover:border-gray-500
          ${isOpen ? 'bg-[var(--color-bg-primary)]' : 'bg-gray-50 dark:bg-gray-900/50'}
        `}
      >
        {/* Header / Summary */}
        <div 
          className="flex items-center gap-2 px-3 py-2 bg-[var(--color-bg-tertiary)]/50 cursor-pointer hover:bg-[var(--color-bg-tertiary)] transition-colors select-none group"
        >
          {/* Drag Handle Area (Optional, for future) */}
          <div 
            className="p-1 rounded hover:bg-[var(--color-bg-element)] text-[var(--color-text-muted)] transition-colors"
            onClick={(e) => { e.stopPropagation(); toggleOpen(); }}
          >
            <ChevronRight 
              size={16} 
              className={`transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} 
            />
          </div>
          
          <input
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-sm font-semibold text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)]"
            value={summary || ''}
            onChange={(e) => updateAttributes({ summary: e.target.value })}
            placeholder="Toggle Title..."
            onKeyDown={(e) => {
               if (e.key === 'Enter') {
                 e.preventDefault();
                 toggleOpen();
               }
            }}
          />
        </div>

        {/* Content */}
        <div 
          className={`
            px-4 py-2 border-t border-[var(--color-border-secondary)]
            ${isOpen ? 'block animate-in slide-in-from-top-2 duration-200' : 'hidden'}
          `}
        >
          <NodeViewContent />
        </div>
      </div>
    </NodeViewWrapper>
  );
}
