import { NodeViewWrapper } from '@tiptap/react';
import { useState, useRef, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';
import { lowlight } from 'lowlight';

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const LANGUAGES = ['bash', 'javascript', 'python', 'json', 'php', 'java', 'go', 'plaintext'];
const METHOD_COLORS = {
  GET: 'bg-emerald-500', POST: 'bg-blue-500',
  PUT: 'bg-amber-500',   PATCH: 'bg-orange-500', DELETE: 'bg-red-500',
};

// hast node → HTML string using project's highlight.js CSS classes
function hastToHtml(node) {
  if (node.type === 'text') return node.value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  if (node.type === 'element') {
    const cls = node.properties?.className?.join(' ') || '';
    const inner = (node.children || []).map(hastToHtml).join('');
    return cls ? `<span class="${cls}">${inner}</span>` : inner;
  }
  return '';
}

function getHighlighted(code, lang) {
  try {
    const result = lang === 'plaintext'
      ? null
      : lowlight.highlight(lang, code || '');
    return result ? result.children.map(hastToHtml).join('') : escapeHtml(code || '');
  } catch {
    return escapeHtml(code || '');
  }
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

export default function APIEndpointBlock({ node, updateAttributes, selected }) {
  const { method, endpoint, description } = node.attrs;
  const lang = node.attrs.lang || 'bash';
  const [copied, setCopied] = useState(false);
  const [isCodeFocused, setIsCodeFocused] = useState(false);
  const textareaRef = useRef(null);

  // Auto-resize textarea to match content, taking min-height into account
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto'; // reset
    ta.style.height = Math.max(80, ta.scrollHeight) + 'px';
  }, [description, isCodeFocused]);

  const html = getHighlighted(description || '', lang);

  return (
    <NodeViewWrapper className="api-endpoint-block my-5">
      <div className={`rounded-xl overflow-hidden border transition-all duration-200 ${selected ? 'border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]/20' : 'border-[var(--color-border-primary)]'}`}>

        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2 bg-[#1e1e2e] border-b border-white/10 flex-wrap gap-y-2">
          {METHODS.map(m => (
            <button key={m}
              onMouseDown={e => { e.preventDefault(); updateAttributes({ method: m }); }}
              className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wide transition-all ${method === m ? `${METHOD_COLORS[m]} text-white` : 'text-slate-500 hover:text-slate-300 hover:bg-white/10'}`}
            >{m}</button>
          ))}
          <span className="text-white/20">|</span>
          <input type="text" value={endpoint}
            onChange={e => updateAttributes({ endpoint: e.target.value })}
            onMouseDown={e => e.stopPropagation()}
            className="flex-1 bg-transparent outline-none text-sm font-mono text-slate-200 placeholder-slate-600 min-w-0 border-none"
            placeholder="/api/v1/endpoint"
          />
          <select value={lang}
            onChange={e => updateAttributes({ lang: e.target.value })}
            onMouseDown={e => e.stopPropagation()}
            className="bg-white/10 border border-white/10 text-slate-300 text-[11px] rounded px-2 py-0.5 outline-none"
          >
            {LANGUAGES.map(l => <option key={l} value={l} className="bg-[#1e1e2e]">{l}</option>)}
          </select>
          <button onMouseDown={handleCopy}
            className="p-1.5 rounded text-slate-500 hover:text-slate-200 hover:bg-white/10 transition-colors"
            title="Copy endpoint"
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
          </button>
        </div>

        {/* Body: Highlighting wrapper */}
        <div 
          className="bg-[#13131f] relative min-h-[80px] max-h-[350px] overflow-y-auto cursor-text group" 
          onClick={(e) => {
            setIsCodeFocused(true);
            // Wait for React to render textarea, then focus it
            setTimeout(() => textareaRef.current?.focus(), 0);
          }}
        >
          {/* Always render the highlighted HTML block behind */}
          <pre 
            aria-hidden="true"
            className={`hljs px-4 py-3 m-0 text-sm font-mono leading-relaxed whitespace-pre-wrap break-words pointer-events-none select-none ${isCodeFocused ? 'opacity-100' : ''}`}
            dangerouslySetInnerHTML={{ __html: html || '<span class="hljs-comment">// Click to add code or description...</span>' }}
          />

          {/* If focused, render transparent textarea exactly on top */}
          {isCodeFocused && (
            <textarea 
              ref={textareaRef} 
              value={description}
              onChange={e => updateAttributes({ description: e.target.value })}
              onBlur={() => setIsCodeFocused(false)}
              onMouseDown={e => e.stopPropagation()}
              spellCheck={false}
              className="absolute inset-0 w-full h-full resize-none bg-transparent border-none outline-none text-sm font-mono leading-relaxed px-4 py-3"
              style={{
                color: 'transparent',
                caretColor: '#cbd5e1', // slate-300
                WebkitTextFillColor: 'transparent',
                overflow: 'hidden'
              }}
              placeholder=""
            />
          )}
        </div>
      </div>
    </NodeViewWrapper>
  );

  function handleCopy(e) {
    e.preventDefault();
    navigator.clipboard.writeText(`${method} ${endpoint}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
}
