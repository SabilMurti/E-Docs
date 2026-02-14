import { useState, useEffect, useRef } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import mermaid from 'mermaid';
import { Play, Code2, Edit3, Save } from 'lucide-react';

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: 'Inter',
});

export default function MermaidComponent({ node, updateAttributes, editor }) {
  const [isEditing, setIsEditing] = useState(false);
  const [code, setCode] = useState(node.attrs.code || 'graph TD\n  A[Start] --> B(Process)\n  B --> C{Decision}\n  C -->|Yes| D[Result 1]\n  C -->|No| E[Result 2]');
  const [svg, setSvg] = useState('');
  const [error, setError] = useState(null);
  
  const containerRef = useRef(null);
  const id = useRef(`mermaid-${Math.random().toString(36).substr(2, 9)}`);

  const renderMermaid = async () => {
    if (!code.trim()) return;
    
    try {
      const { svg: renderedSvg } = await mermaid.render(id.current, code);
      setSvg(renderedSvg);
      setError(null);
      updateAttributes({ code });
    } catch (e) {
      console.error('Mermaid render error:', e);
      setError(e.message);
    }
  };

  useEffect(() => {
    renderMermaid();
  }, [code]);

  return (
    <NodeViewWrapper className="mermaid-node my-6">
      <div className="border-2 border-[var(--color-border-primary)] rounded-xl overflow-hidden bg-[var(--color-bg-secondary)] group">
        {/* Header/Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 bg-[var(--color-bg-tertiary)] border-b border-[var(--color-border-primary)]">
          <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
            <Code2 size={14} />
            <span className="text-xs font-bold uppercase tracking-wider">Mermaid Diagram</span>
          </div>
          
          {editor.isEditable && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`p-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium ${
                isEditing 
                  ? 'bg-[var(--color-accent)] text-white' 
                  : 'hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)]'
              }`}
            >
              {isEditing ? <Save size={14} /> : <Edit3 size={14} />}
              {isEditing ? 'Save' : 'Edit'}
            </button>
          )}
        </div>

        <div className="relative">
          {/* Editor */}
          {isEditing && (
            <div className="p-0 border-b border-[var(--color-border-primary)]">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-48 p-4 font-mono text-sm bg-neutral-900 text-neutral-100 outline-none resize-y"
                placeholder="Enter Mermaid code..."
                spellCheck={false}
              />
              {error && (
                <div className="px-4 py-2 bg-red-500/10 text-red-400 text-xs font-mono">
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Preview */}
          <div 
            className={`mermaid-preview p-6 flex justify-center bg-white ${isEditing ? 'opacity-50' : ''}`}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
          
          {!svg && !error && (
            <div className="p-12 text-center text-[var(--color-text-muted)]">
                Rendering diagram...
            </div>
          )}
        </div>
      </div>
    </NodeViewWrapper>
  );
}
