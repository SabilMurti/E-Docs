/**
 * Callout Extension for Tiptap
 * 
 * A proper node extension for callouts (Info, Success, Warning, Danger)
 * Features:
 * - Proper Tiptap node (not raw HTML)
 * - Editable content
 * - Type switching
 * - Custom styling per type
 */

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { Info, CheckCircle2, AlertTriangle, XCircle, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

// Callout types configuration
const CALLOUT_TYPES = {
  info: {
    icon: Info,
    label: 'Info',
    bgClass: 'bg-blue-50 dark:bg-blue-950/30',
    borderClass: 'border-blue-400 dark:border-blue-600',
    iconClass: 'text-blue-500',
    emoji: '💡'
  },
  success: {
    icon: CheckCircle2,
    label: 'Success',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/30',
    borderClass: 'border-emerald-400 dark:border-emerald-600',
    iconClass: 'text-emerald-500',
    emoji: '✅'
  },
  warning: {
    icon: AlertTriangle,
    label: 'Warning',
    bgClass: 'bg-amber-50 dark:bg-amber-950/30',
    borderClass: 'border-amber-400 dark:border-amber-600',
    iconClass: 'text-amber-500',
    emoji: '⚠️'
  },
  danger: {
    icon: XCircle,
    label: 'Danger',
    bgClass: 'bg-red-50 dark:bg-red-950/30',
    borderClass: 'border-red-400 dark:border-red-600',
    iconClass: 'text-red-500',
    emoji: '🚨'
  }
};

/**
 * React component for rendering the Callout node
 */
function CalloutView({ node, updateAttributes, editor }) {
  const [showTypePicker, setShowTypePicker] = useState(false);
  const typePickerRef = useRef(null);
  const type = node.attrs.type || 'info';
  const config = CALLOUT_TYPES[type] || CALLOUT_TYPES.info;
  const Icon = config.icon;
  
  // Close type picker on click outside
  useEffect(() => {
    if (!showTypePicker) return;
    
    const handleClick = (e) => {
      if (typePickerRef.current && !typePickerRef.current.contains(e.target)) {
        setShowTypePicker(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showTypePicker]);
  
  return (
    <NodeViewWrapper className="callout-wrapper my-4">
      <div 
        className={`
          callout-block relative rounded-lg border-l-4 p-4
          ${config.bgClass} ${config.borderClass}
          transition-colors duration-200
        `}
      >
        {/* Icon + Type Selector */}
        <div className="flex items-start gap-3">
          <div className="relative" ref={typePickerRef}>
            <button
              onClick={() => setShowTypePicker(!showTypePicker)}
              className={`
                w-8 h-8 rounded-lg flex items-center justify-center
                ${config.iconClass} hover:bg-white/50 dark:hover:bg-black/20
                transition-colors cursor-pointer
              `}
              contentEditable={false}
              title="Change callout type"
            >
              <Icon size={20} />
            </button>
            
            {/* Type Picker Dropdown */}
            {showTypePicker && (
              <div className="absolute top-full left-0 mt-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg z-10 py-1 min-w-[140px]">
                {Object.entries(CALLOUT_TYPES).map(([key, cfg]) => {
                  const TypeIcon = cfg.icon;
                  const isActive = key === type;
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        updateAttributes({ type: key });
                        setShowTypePicker(false);
                      }}
                      className={`
                        w-full flex items-center gap-2 px-3 py-1.5 text-left text-sm
                        hover:bg-neutral-100 dark:hover:bg-neutral-800
                        ${isActive ? 'bg-neutral-100 dark:bg-neutral-800' : ''}
                      `}
                    >
                      <TypeIcon size={14} className={cfg.iconClass} />
                      <span>{cfg.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <NodeViewContent className="callout-content outline-none" />
          </div>
        </div>
      </div>
    </NodeViewWrapper>
  );
}

/**
 * Callout Extension
 */
export const Callout = Node.create({
  name: 'callout',
  
  group: 'block',
  
  content: 'block+',
  
  defining: true,
  
  addAttributes() {
    return {
      type: {
        default: 'info',
        parseHTML: element => element.getAttribute('data-type') || 'info',
        renderHTML: attributes => ({
          'data-type': attributes.type,
        }),
      },
    };
  },
  
  parseHTML() {
    return [
      {
        tag: 'div[data-callout]',
      },
    ];
  },
  
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-callout': '' }), 0];
  },
  
  addNodeView() {
    return ReactNodeViewRenderer(CalloutView);
  },
  
  addCommands() {
    return {
      setCallout: (attributes) => ({ commands, state, chain }) => {
        const { selection } = state;
        const { $from } = selection;
        const currentNode = $from.parent;
        
        // If current node is empty paragraph, replace it with callout containing a paragraph
        if (currentNode.type.name === 'paragraph' && currentNode.textContent === '') {
          return chain()
            .deleteCurrentNode()
            .insertContent({
              type: this.name,
              attrs: attributes,
              content: [{ type: 'paragraph' }]
            })
            .run();
        }
        
        // Otherwise wrap existing content
        return commands.wrapIn(this.name, attributes);
      },
      toggleCallout: (attributes) => ({ commands }) => {
        return commands.toggleWrap(this.name, attributes);
      },
      updateCalloutType: (type) => ({ commands, state }) => {
        const { selection } = state;
        const node = state.doc.nodeAt(selection.from);
        if (node?.type.name === 'callout') {
          return commands.updateAttributes('callout', { type });
        }
        return false;
      },
    };
  },
  
  addKeyboardShortcuts() {
    return {
      // Mod = Ctrl on Windows, Cmd on Mac
      'Mod-Shift-c': () => this.editor.commands.setCallout({ type: 'info' }),
    };
  },
});

export default Callout;
