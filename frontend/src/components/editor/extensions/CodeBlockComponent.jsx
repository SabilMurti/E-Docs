import { NodeViewContent, NodeViewWrapper } from '@tiptap/react';
import { Copy, Check, ChevronDown } from 'lucide-react';
import { useState } from 'react';

const languages = [
  { value: 'auto', label: 'Auto' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'php', label: 'PHP' },
  { value: 'sql', label: 'SQL' },
  { value: 'shell', label: 'Shell' },
  { value: 'json', label: 'JSON' },
];

export default function CodeBlockComponent({ node, updateAttributes, extension }) {
  const [isCopied, setIsCopied] = useState(false);
  const selectedLang = node.attrs.language || 'auto';

  const handleCopy = () => {
    const text = node.textContent;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <NodeViewWrapper className="code-block-wrapper relative group my-4 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-tertiary)] overflow-hidden">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border-primary)]">
        {/* Language Selector */}
        <div className="relative">
          <select 
            contentEditable={false}
            suppressContentEditableWarning
            value={selectedLang} 
            onChange={e => updateAttributes({ language: e.target.value })}
            className="appearance-none bg-transparent text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer focus:outline-none"
          >
            {languages.map(lang => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>

        {/* Copy Button */}
        <button 
          onClick={handleCopy}
          className="p-1 rounded hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
          title="Copy code"
        >
          {isCopied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
        </button>
      </div>

      {/* Code Text Area */}
      <pre className="p-4 m-0 overflow-x-auto">
        <NodeViewContent as="code" className={`language-${selectedLang}`} />
      </pre>
    </NodeViewWrapper>
  );
}
