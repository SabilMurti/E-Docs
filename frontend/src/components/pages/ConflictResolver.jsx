import { useState, useMemo } from 'react';
import { Check, ArrowRight, Info, User } from 'lucide-react';
import { diffWordsWithSpace } from 'diff';
import Button from '../common/Button';

// Helper: Extract text from Prosemirror JSON (Simplified for conflict view)
const getTextFromJSON = (node) => {
  if (!node) return '';
  if (node.type === 'text') return node.text || '';
  if (node.type === 'hardBreak') return '\n';
  if (node.content) {
    const childrenText = node.content.map(getTextFromJSON).join('');
    switch (node.type) {
      case 'paragraph': return childrenText + '\n';
      case 'heading': return '#'.repeat(node.attrs?.level || 1) + ' ' + childrenText + '\n';
      case 'listItem': return '• ' + childrenText + '\n';
      default: return childrenText + (node.isBlock ? '\n' : '');
    }
  }
  return '';
};

export default function ConflictResolver({ 
  liveContent, 
  incomingContent, 
  currentUserName, 
  contributorName,
  onResolve 
}) {
  const [resolution, setResolution] = useState(null); // 'live' | 'incoming'

  const liveText = useMemo(() => getTextFromJSON(liveContent), [liveContent]);
  const incomingText = useMemo(() => getTextFromJSON(incomingContent), [incomingContent]);

  // Internal Diff Calculation
  const diffs = useMemo(() => {
    return diffWordsWithSpace(liveText, incomingText);
  }, [liveText, incomingText]);

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-gray-300">
      <div className="bg-red-900/10 border-b border-red-900/30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-500/20 rounded-full text-red-400">
            <Info size={20} />
          </div>
          <div>
            <h3 className="font-bold text-white">Conflict detected in content</h3>
            <p className="text-xs text-gray-400">Choose which version to keep or combine them manually later.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-8">
        <div className="space-y-4">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-2">
            <User size={14} /> Resolving Conflicts
          </h4>
          
          <div className="font-mono text-sm border border-gray-700 rounded-xl overflow-hidden shadow-2xl">
            {/* Markers Header for Live */}
            <div className="bg-[#1c2128] px-4 py-2 border-b border-gray-700 flex justify-between items-center group cursor-pointer hover:bg-[#22272e]"
                 onClick={() => setResolution('live')}>
              <span className="text-blue-400 font-bold flex items-center gap-2">
                &lt;&lt;&lt;&lt;&lt;&lt;&lt; {currentUserName} (Current change)
                {resolution === 'live' && <Check size={14} className="text-green-400" />}
              </span>
              <span className="text-[10px] text-gray-500 group-hover:text-blue-400">Click to accept</span>
            </div>
            
            {/* Live Content Display with Highlights */}
            <div className={`p-4 bg-blue-500/5 transition-colors ${resolution === 'live' ? 'ring-2 ring-inset ring-blue-500/10 bg-blue-500/10' : ''}`}>
              <pre className="whitespace-pre-wrap font-sans text-gray-300 leading-relaxed text-sm">
                {diffs.map((part, i) => {
                  // In Current (Live) block, we only show parts that are Common OR Removed (existed in live)
                  if (part.added) return null; // Don't show what's new in incoming
                  
                  return (
                    <span key={i} className={part.removed ? "bg-red-500/20 text-red-200" : ""}>
                      {part.value}
                    </span>
                  );
                })}
              </pre>
            </div>

            {/* Separator Marker */}
            <div className="bg-[#1c2128] px-4 py-1 border-y border-gray-700 text-gray-600 font-bold text-center select-none">
              =======
            </div>

            {/* Incoming Content Display with Highlights */}
            <div className={`p-4 bg-emerald-500/5 transition-colors ${resolution === 'incoming' ? 'ring-2 ring-inset ring-emerald-500/10 bg-emerald-500/10' : ''}`}>
              <pre className="whitespace-pre-wrap font-sans text-gray-300 leading-relaxed text-sm">
                 {diffs.map((part, i) => {
                  // In New (Incoming) block, we only show parts that are Common OR Added
                  if (part.removed) return null; // Don't show what was removed from live
                  
                  return (
                    <span key={i} className={part.added ? "bg-green-500/20 text-green-200" : ""}>
                      {part.value}
                    </span>
                  );
                })}
              </pre>
            </div>

            {/* Markers Footer for Incoming */}
            <div className="bg-[#1c2128] px-4 py-2 border-t border-gray-700 flex justify-between items-center group cursor-pointer hover:bg-[#22272e]"
                 onClick={() => setResolution('incoming')}>
              <span className="text-emerald-400 font-bold flex items-center gap-2">
                &gt;&gt;&gt;&gt;&gt;&gt;&gt; {contributorName} (Incoming change)
                {resolution === 'incoming' && <Check size={14} className="text-green-400" />}
              </span>
              <span className="text-[10px] text-gray-500 group-hover:text-emerald-400">Click to accept</span>
            </div>
          </div>
        </div>

        {/* Manual Merge Notice */}
        <div className="bg-[#161b22] p-4 rounded-lg border border-gray-700 flex gap-4">
          <div className="text-blue-400 shrink-0"><Info size={20} /></div>
          <p className="text-sm text-gray-400">
             Setelah memilih salah satu versi, Anda dapat mengklik <strong>"Resolve & Save"</strong>. 
             Sistem akan menggunakan konten yang Anda pilih sebagai base baru.
          </p>
        </div>
      </div>

      <div className="p-6 bg-[#161b22] border-t border-gray-700 flex justify-end gap-3">
        <Button variant="ghost" onClick={() => setResolution(null)}>Clear Choice</Button>
        <Button 
          variant="primary" 
          disabled={!resolution} 
          onClick={() => onResolve(resolution === 'live' ? liveContent : incomingContent)}
        >
          Resolve & Save <ArrowRight size={16} className="ml-2" />
        </Button>
      </div>
    </div>
  );
}
