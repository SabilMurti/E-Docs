/**
 * Callout Extension for Tiptap
 *
 * Uses inline styles to guarantee background color survives
 * any CSS reset (prose, ProseMirror, etc.)
 */

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { Info, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

// Callout config with INLINE styles (immune to CSS overrides)
const CALLOUT_TYPES = {
  info: {
    icon: Info,
    label: 'Info',
    bg: '#dbeafe',
    bgDark: 'rgba(59,130,246,0.15)',
    border: '#3b82f6',
    iconColor: '#3b82f6',
  },
  success: {
    icon: CheckCircle2,
    label: 'Success',
    bg: '#dcfce7',
    bgDark: 'rgba(34,197,94,0.15)',
    border: '#22c55e',
    iconColor: '#22c55e',
  },
  warning: {
    icon: AlertTriangle,
    label: 'Warning',
    bg: '#fef3c7',
    bgDark: 'rgba(245,158,11,0.15)',
    border: '#f59e0b',
    iconColor: '#f59e0b',
  },
  danger: {
    icon: XCircle,
    label: 'Danger',
    bg: '#fee2e2',
    bgDark: 'rgba(239,68,68,0.15)',
    border: '#ef4444',
    iconColor: '#ef4444',
  },
};

function CalloutView({ node, updateAttributes }) {
  const [showTypePicker, setShowTypePicker] = useState(false);
  const typePickerRef = useRef(null);
  const type = node.attrs.type || 'info';
  const cfg = CALLOUT_TYPES[type] || CALLOUT_TYPES.info;
  const Icon = cfg.icon;

  // Detect dark mode
  const isDark = document.documentElement.classList.contains('dark');
  const bgColor = isDark ? cfg.bgDark : cfg.bg;

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
    <NodeViewWrapper
      as="div"
      data-callout-type={type}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        padding: '0.875rem 1rem',
        borderLeft: `4px solid ${cfg.border}`,
        borderRadius: '0 8px 8px 0',
        backgroundColor: bgColor,
        margin: '0.75rem 0',
        position: 'relative',
        boxSizing: 'border-box',
      }}
    >
      {/* Icon + Type Selector — non-editable */}
      <div
        ref={typePickerRef}
        contentEditable={false}
        style={{ position: 'relative', flexShrink: 0, marginTop: '1px' }}
      >
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            setShowTypePicker((v) => !v);
          }}
          title="Change callout type"
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            color: cfg.iconColor,
          }}
        >
          <Icon size={18} />
        </button>

        {/* Type Picker Dropdown */}
        {showTypePicker && (
          <div className="callout-type-picker">
            {Object.entries(CALLOUT_TYPES).map(([key, c]) => {
              const TypeIcon = c.icon;
              return (
                <button
                  key={key}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    updateAttributes({ type: key });
                    setShowTypePicker(false);
                  }}
                  className={`callout-type-option ${key === type ? 'callout-type-active' : ''}`}
                >
                  <TypeIcon size={14} style={{ color: c.iconColor }} />
                  <span>{c.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Editable Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <NodeViewContent
          style={{
            outline: 'none',
            color: 'var(--color-text-primary)',
            fontSize: '0.9375rem',
            lineHeight: '1.6',
          }}
        />
      </div>
    </NodeViewWrapper>
  );
}

export const Callout = Node.create({
  name: 'callout',

  group: 'block',

  content: 'paragraph+',

  defining: true,
  isolating: true,

  addAttributes() {
    return {
      type: {
        default: 'info',
        parseHTML: (el) => el.getAttribute('data-type') || 'info',
        renderHTML: (attrs) => ({ 'data-type': attrs.type }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-callout]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-callout': '' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutView);
  },

  addCommands() {
    return {
      setCallout:
        (attributes) =>
        ({ commands, state, chain }) => {
          const { $from } = state.selection;
          const currentNode = $from.parent;

          if (currentNode.type.name === 'paragraph' && currentNode.textContent === '') {
            return chain()
              .deleteCurrentNode()
              .insertContent({
                type: this.name,
                attrs: attributes,
                content: [{ type: 'paragraph' }],
              })
              .run();
          }

          return commands.wrapIn(this.name, attributes);
        },
      toggleCallout:
        (attributes) =>
        ({ commands }) =>
          commands.toggleWrap(this.name, attributes),
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-c': () => this.editor.commands.setCallout({ type: 'info' }),
    };
  },
});

export default Callout;
