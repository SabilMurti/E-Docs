/**
 * CodeBlockPlus Extension for Tiptap
 *
 * Enhanced code block with:
 * - Syntax highlighting (via highlight.js)
 * - Language selector
 * - Copy button
 * - Line numbers (optional)
 * - Filename header
 * - Theme-connected colors
 */

import { mergeAttributes, textblockTypeInputRule } from '@tiptap/core';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { lowlight } from 'lowlight';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { useState, useRef, useEffect } from 'react';
import { Copy, Check, ChevronDown, Terminal } from 'lucide-react';

// Popular languages for the selector
const LANGUAGES = [
  { id: 'plaintext', name: 'Plain Text' },
  { id: 'javascript', name: 'JavaScript' },
  { id: 'typescript', name: 'TypeScript' },
  { id: 'jsx', name: 'JSX' },
  { id: 'tsx', name: 'TSX' },
  { id: 'html', name: 'HTML' },
  { id: 'css', name: 'CSS' },
  { id: 'scss', name: 'SCSS' },
  { id: 'json', name: 'JSON' },
  { id: 'python', name: 'Python' },
  { id: 'java', name: 'Java' },
  { id: 'go', name: 'Go' },
  { id: 'rust', name: 'Rust' },
  { id: 'php', name: 'PHP' },
  { id: 'ruby', name: 'Ruby' },
  { id: 'sql', name: 'SQL' },
  { id: 'bash', name: 'Bash' },
  { id: 'shell', name: 'Shell' },
];

/**
 * React component for rendering the CodeBlock node
 */
function CodeBlockView({ node, updateAttributes, editor, extension }) {
  const [copied, setCopied] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const langPickerRef = useRef(null);
  const searchInputRef = useRef(null);

  const language = node.attrs.language || 'plaintext';
  const filename = node.attrs.filename || '';
  const showLineNumbers = node.attrs.showLineNumbers ?? true;

  // Get language display name
  const languageDisplay = LANGUAGES.find(l => l.id === language)?.name || language;

  // Filter languages by search
  const filteredLanguages = LANGUAGES.filter(lang =>
    !searchQuery ||
    lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Copy code to clipboard
  const handleCopy = () => {
    const code = node.textContent;
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  };

  // Close language picker on click outside
  useEffect(() => {
    if (!showLangPicker) return;

    const handleClick = (e) => {
      if (langPickerRef.current && !langPickerRef.current.contains(e.target)) {
        setShowLangPicker(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showLangPicker]);

  // Focus search input when picker opens
  useEffect(() => {
    if (showLangPicker && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [showLangPicker]);

  return (
    <NodeViewWrapper className="code-block-wrapper my-8 group code-block-plus relative font-sans">
      {/* Floating Controls (Top Right Overlay) */}
      <div
        className="absolute -top-10 right-0 z-30 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-2 group-hover:translate-y-0"
        contentEditable={false}
      >
        {/* Language Picker */}
        <div className="relative" ref={langPickerRef}>
          <button
            onClick={() => setShowLangPicker(!showLangPicker)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-hover)] border border-[var(--color-border-primary)] hover:border-[var(--color-border-secondary)] text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all shadow-lg"
            title="Change language"
          >
            <span className="opacity-70">Lang:</span>
            <span className="font-semibold" style={{ color: 'var(--color-accent)' }}>{languageDisplay}</span>
            <ChevronDown size={12} className="transition-transform duration-200" style={{ color: 'var(--color-text-muted)', transform: showLangPicker ? 'rotate(180deg)' : '' }} />
          </button>

          {/* Language Dropdown */}
          {showLangPicker && (
            <div className="absolute top-full right-0 mt-2 w-64 max-h-[300px] bg-[var(--color-bg-elevated)] border border-[var(--color-border-primary)] rounded-xl shadow-xl z-50 flex flex-col animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
              {/* Search Header */}
              <div className="p-3 border-b border-[var(--color-border-secondary)] bg-[var(--color-bg-tertiary)]">
                <input
                  ref={searchInputRef}
                  type="text"
                  className="w-full px-3 py-2 text-sm bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)]"
                  placeholder="Search language..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && filteredLanguages.length > 0) {
                      updateAttributes({ language: filteredLanguages[0].id });
                      setShowLangPicker(false);
                      setSearchQuery('');
                    }
                  }}
                />
              </div>

              {/* Language List */}
              <div className="overflow-y-auto flex-1 p-2 scrollbar-thin scrollbar-thumb-[var(--color-border-secondary)] scrollbar-track-transparent bg-[var(--color-bg-primary)]">
                {filteredLanguages.length > 0 ? (
                  <div className="grid grid-cols-1 gap-1">
                    {filteredLanguages.map(lang => (
                      <button
                        key={lang.id}
                        onClick={() => {
                          updateAttributes({ language: lang.id });
                          setShowLangPicker(false);
                          setSearchQuery('');
                        }}
                        className={`
                          w-full text-left px-3 py-2 text-xs rounded-lg transition-all
                          ${language === lang.id 
                            ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-medium' 
                            : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]'
                          }
                        `}
                      >
                       {lang.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-2 py-8 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    No languages found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-hover)] border border-[var(--color-border-primary)] hover:border-[var(--color-border-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all"
          title="Copy code"
        >
          {copied ? <Check size={14} style={{ color: 'var(--color-success)' }} /> : <Copy size={14} style={{ color: 'var(--color-text-muted)' }} />}
          <span className="text-xs font-medium">{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      <div className="relative rounded-xl overflow-hidden bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] shadow-lg">
        {/* Header Bar */}
        <div
          className="relative flex items-center justify-between px-4 py-3 bg-[var(--color-bg-tertiary)] border-b border-[var(--color-border-primary)]"
          contentEditable={false}
        >
          <div className="flex items-center gap-4 flex-1">
            {/* Window Controls */}
            <div className="flex items-center gap-2 group/dots">
              <div className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e] hover:brightness-110 shadow-sm" />
              <div className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123] hover:brightness-110 shadow-sm" />
              <div className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29] hover:brightness-110 shadow-sm" />
            </div>

            {/* Vertical Divider */}
            <div className="w-[1px] h-4 bg-[var(--color-border-secondary)]" />

            {/* Filename Input */}
            <div className="flex-1 flex justify-center -ml-16">
              <input
                type="text"
                value={filename}
                onChange={(e) => updateAttributes({ filename: e.target.value })}
                placeholder="Untitled"
                className="bg-transparent text-center text-xs font-medium text-[var(--color-text-secondary)] focus:text-[var(--color-text-primary)] focus:outline-none placeholder-[var(--color-text-muted)] min-w-[100px] hover:text-[var(--color-text-primary)] transition-colors"
                spellCheck={false}
              />
            </div>
          </div>
        </div>

        {/* Code Content */}
        <div className="relative bg-[var(--color-bg-primary)]">
          <pre className={`relative font-mono text-sm leading-relaxed p-5 overflow-x-auto text-[var(--color-text-primary)] ${showLineNumbers ? 'line-numbers' : ''}`}>
            <NodeViewContent as="code" className={`language-${language}`} />
          </pre>
        </div>
      </div>
    </NodeViewWrapper>
  );
}

/**
 * CodeBlockPlus Extension
 */
export const CodeBlockPlus = CodeBlockLowlight.extend({
  name: 'codeBlock',

  addOptions() {
    return {
      lowlight,
      defaultLanguage: 'plaintext',
      HTMLAttributes: {},
    }
  },

  group: 'block',

  content: 'text*',

  marks: '',

  code: true,

  defining: true,

  addAttributes() {
    return {
      language: {
        default: 'plaintext',
        parseHTML: element => {
          const classAttr = element.firstElementChild?.getAttribute('class') || '';
          const match = classAttr.match(/language-(\w+)/);
          return match ? match[1] : 'plaintext';
        },
        renderHTML: attributes => ({
          class: attributes.language ? `language-${attributes.language}` : '',
        }),
      },
      filename: {
        default: '',
        parseHTML: element => element.getAttribute('data-filename') || '',
        renderHTML: attributes => ({
          'data-filename': attributes.filename,
        }),
      },
      showLineNumbers: {
        default: true,
        parseHTML: element => element.getAttribute('data-line-numbers') !== 'false',
        renderHTML: attributes => ({
          'data-line-numbers': attributes.showLineNumbers,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'pre',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['pre', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), ['code', 0]];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockView);
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-c': () => this.editor.commands.toggleCodeBlock(),
    };
  },
});

export default CodeBlockPlus;
