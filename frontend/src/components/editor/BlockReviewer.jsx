import { useState, useMemo, useEffect } from 'react';
import { Check, X, Undo, GitMerge, Info } from 'lucide-react';
import RichEditor from './RichEditor';

/**
 * BlockReviewer - Advanced merge tool that allows picking blocks
 */
export default function BlockReviewer({ oldContent, newContent, onMerge }) {
  const [selectedBlocks, setSelectedBlocks] = useState([]);
  
  const blocks = useMemo(() => {
    // Prosemirror structure is { type: 'doc', content: [...] }
    // We need the inner 'content' array which contains the blocks
    const oldArr = Array.isArray(oldContent?.content?.content) ? oldContent.content.content : [];
    const newArr = Array.isArray(newContent?.content?.content) ? newContent.content.content : [];
    
    // If newArr is empty but there is content, might be a different format or empty doc
    if (newArr.length === 0 && newContent?.content) {
       console.warn("BlockReviewer: newContent has content but it lacks a content array", newContent.content);
    }
    
    return newArr.map((node, index) => {
      // Check if this node matches exactly with the same index in old
      const isEqual = oldArr[index] && JSON.stringify(node) === JSON.stringify(oldArr[index]);
      
      return {
        id: `block-${index}`,
        node,
        isNew: !isEqual,
        accepted: true // Default to accept proposed change
      };
    });
  }, [oldContent, newContent]);

  useEffect(() => {
    setSelectedBlocks(blocks);
  }, [blocks]);

  const toggleBlock = (id) => {
    setSelectedBlocks(prev => prev.map(b => 
      b.id === id ? { ...b, accepted: !b.accepted } : b
    ));
  };

  const currentMergedContent = useMemo(() => {
    return {
      type: 'doc',
      content: selectedBlocks
        .filter(b => b.accepted)
        .map(b => b.node)
    };
  }, [selectedBlocks]);

  const stats = {
    total: selectedBlocks.length,
    new: selectedBlocks.filter(b => b.isNew).length,
    accepted: selectedBlocks.filter(b => b.isNew && b.accepted).length,
    rejected: selectedBlocks.filter(b => b.isNew && !b.accepted).length,
  };

  return (
    <div className="flex flex-col h-full bg-[color:var(--color-bg-primary)]">
      {/* Mini Dashboard */}
      <div className="bg-[color:var(--color-bg-secondary)] border-b border-[color:var(--color-border-primary)] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] text-[color:var(--color-text-muted)] uppercase tracking-wider font-bold">New Blocks</span>
            <span className="text-lg font-bold text-green-400">{stats.new}</span>
          </div>
          <div className="flex flex-col border-l border-[color:var(--color-border-secondary)] pl-6">
            <span className="text-[10px] text-[color:var(--color-text-muted)] uppercase tracking-wider font-bold">Accepted</span>
            <span className="text-lg font-bold text-blue-400">{stats.accepted}</span>
          </div>
          <div className="flex flex-col border-l border-[color:var(--color-border-secondary)] pl-6">
            <span className="text-[10px] text-[color:var(--color-text-muted)] uppercase tracking-wider font-bold">Removed</span>
            <span className="text-lg font-bold text-red-400">{stats.rejected}</span>
          </div>
        </div>
        
        <button
          onClick={() => onMerge(currentMergedContent)}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold flex items-center gap-2 shadow-lg transition-all hover:scale-[1.02] active:scale-95"
        >
          <GitMerge size={18} />
          Merge Selected
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex items-center gap-2 mb-6 text-sm text-[color:var(--color-text-muted)] bg-[color:var(--color-bg-secondary)] p-3 rounded-lg border border-[color:var(--color-border-primary)]">
            <Info size={16} />
            <span>Click on blocks to toggle their inclusion in the final merge. Green border indicates changes.</span>
          </div>

          {selectedBlocks.map((block) => (
            <div 
              key={block.id}
              onClick={() => toggleBlock(block.id)}
              className={`relative group cursor-pointer border-2 rounded-xl transition-all duration-200 ${
                block.accepted 
                  ? (block.isNew ? 'border-green-500/50 bg-green-500/5' : 'border-transparent hover:border-blue-500/30')
                  : 'border-red-500/30 opacity-40 grayscale scale-[0.98]'
              }`}
            >
              {/* Status Indicator */}
              <div className={`absolute -left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full shadow-lg flex items-center justify-center z-10 transition-colors ${
                block.accepted ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'
              }`}>
                {block.accepted ? <Check size={16} /> : <X size={16} />}
              </div>

              {/* Block Content */}
              <div className="p-4 pl-10">
                <div className="prose prose-invert max-w-none pointer-events-none">
                   {/* We use a simplified renderer or just the RichEditor in read-only */}
                   <RichEditor 
                     content={{ type: 'doc', content: [block.node] }} 
                     editable={false} 
                   />
                </div>
              </div>

              {/* Hover Actions */}
              <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                 <button className="p-2 rounded-lg bg-[color:var(--color-bg-tertiary)] hover:bg-[color:var(--color-bg-hover)] text-[color:var(--color-text-muted)]">
                   {block.accepted ? <Undo size={14} /> : <Check size={14} />}
                 </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
