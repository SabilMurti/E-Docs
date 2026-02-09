/**
 * CodeBlockPlus Extension for Tiptap
 * 
 * Enhanced code block with:
 * - Syntax highlighting (via highlight.js)
 * - Language selector
 * - Copy button
 * - Line numbers (optional)
 * - Filename header
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
  { id: 'less', name: 'LESS' },
  { id: 'json', name: 'JSON' },
  { id: 'xml', name: 'XML' },
  { id: 'yaml', name: 'YAML' },
  { id: 'markdown', name: 'Markdown' },
  { id: 'python', name: 'Python' },
  { id: 'java', name: 'Java' },
  { id: 'c', name: 'C' },
  { id: 'cpp', name: 'C++' },
  { id: 'csharp', name: 'C#' },
  { id: 'go', name: 'Go' },
  { id: 'rust', name: 'Rust' },
  { id: 'php', name: 'PHP' },
  { id: 'ruby', name: 'Ruby' },
  { id: 'swift', name: 'Swift' },
  { id: 'kotlin', name: 'Kotlin' },
  { id: 'dart', name: 'Dart' },
  { id: 'sql', name: 'SQL' },
  { id: 'bash', name: 'Bash' },
  { id: 'shell', name: 'Shell' },
  { id: 'powershell', name: 'PowerShell' },
  { id: 'dockerfile', name: 'Dockerfile' },
  { id: 'nginx', name: 'Nginx' },
  { id: 'graphql', name: 'GraphQL' },
  { id: 'lua', name: 'Lua' },
  { id: 'perl', name: 'Perl' },
  { id: 'r', name: 'R' },
  { id: 'scala', name: 'Scala' },
  { id: 'elixir', name: 'Elixir' },
  { id: 'clojure', name: 'Clojure' },
  { id: 'haskell', name: 'Haskell' },
  { id: 'fsharp', name: 'F#' },
  { id: 'vbnet', name: 'VB.NET' },
  { id: 'objectivec', name: 'Objective-C' },
  { id: 'groovy', name: 'Groovy' },
  { id: 'matlab', name: 'MATLAB' },
  { id: 'julia', name: 'Julia' },
  { id: 'makefile', name: 'Makefile' },
  { id: 'ini', name: 'INI' },
  { id: 'toml', name: 'TOML' },
  { id: 'diff', name: 'Diff' },
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
      // Small timeout to allow render
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
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#252526] hover:bg-[#333] border border-[#333] hover:border-[#444] text-xs font-medium text-gray-300 hover:text-white transition-all shadow-xl backdrop-blur-sm"
            title="Change language"
          >
            <span className="opacity-70">Lang:</span>
            <span className="text-blue-400 font-semibold">{languageDisplay}</span>
            <ChevronDown size={12} className={`text-gray-500 transition-transform duration-200 ${showLangPicker ? 'rotate-180' : ''}`} />
          </button>
          
          {/* Language Dropdown */}
          {showLangPicker && (
            <div className="absolute top-full right-0 mt-2 w-64 max-h-[300px] bg-[#1e1e1e] border border-[#444] rounded-xl shadow-2xl z-50 flex flex-col animate-in fade-in zoom-in-95 duration-100 ring-1 ring-white/10 overflow-hidden">
              {/* Search Header */}
              <div className="p-3 border-b border-[#333] bg-[#252526]">
                <input
                  ref={searchInputRef}
                  type="text"
                  className="w-full px-3 py-2 text-sm bg-[#1a1a1a] border border-[#333] rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white placeholder-gray-500"
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
              <div className="overflow-y-auto flex-1 p-2 scrollbar-thin scrollbar-thumb-[#444] scrollbar-track-transparent bg-[#1e1e1e]">
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
                            ? 'bg-blue-500/10 text-blue-400 font-semibold border border-blue-500/20' 
                            : 'text-gray-400 hover:text-gray-100 hover:bg-[#333]'
                          }
                        `}
                      >
                       {lang.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-2 py-8 text-center text-sm text-gray-500">
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
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#252526] hover:bg-[#333] border border-[#333] hover:border-[#444] text-gray-300 hover:text-white transition-all shadow-xl backdrop-blur-sm"
          title="Copy code"
        >
          {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} className="text-gray-400" />}
          <span className="text-xs font-medium">{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      <div className="relative rounded-xl overflow-hidden bg-[#1e1e1e] border border-[#333] shadow-2xl ring-1 ring-white/5">
        {/* Bloom Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 pointer-events-none" />
        
        {/* Header Bar */}
        <div 
          className="relative flex items-center justify-between px-4 py-3 bg-[#252526] border-b border-[#333]" 
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
            <div className="w-[1px] h-4 bg-[#444]" />

            {/* Filename Input */}
            <div className="flex-1 flex justify-center -ml-16">
              <input
                type="text"
                value={filename}
                onChange={(e) => updateAttributes({ filename: e.target.value })}
                placeholder="Untitled"
                className="bg-transparent text-center text-xs font-medium text-gray-400 focus:text-gray-100 focus:outline-none placeholder-gray-600 min-w-[100px] hover:text-gray-300 transition-colors"
                spellCheck={false}
              />
            </div>
          </div>
        </div>
        
        {/* Code Content */}
        <div className="relative bg-[#1e1e1e]">
          <pre className={`relative font-mono text-sm leading-relaxed p-5 overflow-x-auto text-gray-300 ${showLineNumbers ? 'line-numbers' : ''}`}>
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
          'data-line-numbers': attributes.showLineNumbers ? 'true' : 'false',
        }),
      },
    };
  },
  
  parseHTML() {
    return [
      {
        tag: 'pre',
        preserveWhitespace: 'full',
      },
    ];
  },
  
  renderHTML({ HTMLAttributes }) {
    return ['pre', mergeAttributes(HTMLAttributes), ['code', {}, 0]];
  },
  
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockView);
  },
  
  addCommands() {
    return {
      setCodeBlock: (attributes) => ({ commands, state, chain }) => {
        const { selection } = state;
        const { $from } = selection;
        const currentNode = $from.parent;
        
        // If current node is empty paragraph, replace with code block
        if (currentNode.type.name === 'paragraph' && currentNode.textContent === '') {
          return chain()
            .deleteCurrentNode()
            .insertContent({
              type: this.name,
              attrs: attributes,
              content: [{ type: 'text', text: '// Your code here' }]
            })
            .run();
        }
        
        // Otherwise convert current node to code block
        return commands.setNode(this.name, attributes);
      },
      toggleCodeBlock: (attributes) => ({ commands, state }) => {
        const { selection } = state;
        const node = state.doc.nodeAt(selection.$from.before(selection.$from.depth));
        
        if (node?.type.name === 'codeBlock') {
          return commands.setParagraph();
        }
        return commands.setNode(this.name, attributes);
      },
    };
  },
  
  addKeyboardShortcuts() {
    return {
      'Mod-Alt-c': () => this.editor.commands.toggleCodeBlock(),
      // Tab should insert actual tab character inside code blocks
      Tab: () => {
        if (this.editor.isActive('codeBlock')) {
          return this.editor.commands.insertContent('\t');
        }
        return false;
      },
      // Shift-Tab for unindent
      'Shift-Tab': () => {
        if (this.editor.isActive('codeBlock')) {
          // TODO: Implement unindent
          return true;
        }
        return false;
      },
    };
  },
  
  addInputRules() {
    return [
      // ``` followed by optional language triggers code block
      textblockTypeInputRule({
        find: /^```([a-z]*)?[\s\n]$/,
        type: this.type,
        getAttributes: match => ({
          language: match[1] || 'plaintext',
        }),
      }),
    ];
  },
});

export default CodeBlockPlus;
