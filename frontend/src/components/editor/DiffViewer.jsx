import { useMemo } from 'react';
import { diffWordsWithSpace } from 'diff';

// Helper: Parse content safely
const parseContent = (content) => {
  if (!content) return null;
  if (typeof content === 'object') return content;
  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content);
      if (typeof parsed === 'string') {
        try { return JSON.parse(parsed); } catch (e) { return parsed; } 
      }
      return parsed;
    } catch (e) {
      return {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: content }] }]
      };
    }
  }
  return content;
};

// Helper: Extract text preserving structure
const getTextFromJSON = (node) => {
  if (!node) return '';

  // 1. Text Node
  if (node.type === 'text') {
    return node.text || '';
  }

  // 2. Hard Break (Shift+Enter)
  if (node.type === 'hardBreak') {
    return '\n';
  }

  // 3. Container Nodes (Check children)
  if (node.content) {
    const childrenText = node.content.map(getTextFromJSON).join('');
    
    // Add structure based on block type
    switch (node.type) {
      case 'doc':
        return childrenText;
        
      case 'paragraph':
        // Paragraf: Double newline untuk jarak antar paragraf
        return childrenText + '\n\n';
        
      case 'heading':
        const level = node.attrs?.level || 1;
        // Heading: Prefix # + text + double newline
        return '#'.repeat(level) + ' ' + childrenText + '\n\n';
        
      case 'bulletList':
      case 'orderedList':
        // List container: Newline di akhir list
        return childrenText + '\n';
        
      case 'listItem':
        // List item: Bullet + text + single newline
        return '• ' + childrenText + '\n';
        
      case 'codeBlock':
        return '\n```\n' + childrenText + '\n```\n\n';
        
      case 'blockquote':
        return '> ' + childrenText + '\n\n';
        
      case 'image':
        return '[Image]\n\n';
        
      default:
        // Default block: tambahkan newline jaga-jaga
        return childrenText + '\n';
    }
  }
  
  return '';
};

export default function DiffViewer({ oldContent, newContent }) {
  const diffResult = useMemo(() => {
    const safeOld = parseContent(oldContent);
    const safeNew = parseContent(newContent);

    const text1 = safeOld ? getTextFromJSON(safeOld) : '';
    const text2 = safeNew ? getTextFromJSON(safeNew) : '';
    
    // Debug
    console.log('[DiffViewer] Old:', text1 ? text1.substring(0,20)+'...' : 'EMPTY');
    console.log('[DiffViewer] New:', text2 ? text2.substring(0,20)+'...' : 'EMPTY');

    return diffWordsWithSpace(text1, text2);
  }, [oldContent, newContent]);

  const isEmptyOld = !oldContent || (typeof oldContent === 'object' && Object.keys(oldContent).length === 0);

  if (!oldContent && !newContent) {
    return <div className="text-gray-500 italic p-4">No content available.</div>;
  }

  if (diffResult.length === 0) {
      return <div className="text-gray-400 p-4">No text changes detected.</div>;
  }

  return (
    <div className="diff-viewer bg-[#0d1117] rounded-lg border border-gray-700 text-sm font-mono shadow-inner">
      {isEmptyOld && (
        <div className="bg-yellow-900/20 text-yellow-400 px-4 py-2 text-xs border-b border-yellow-900/30">
           ⚠️ Comparing against empty/new content
        </div>
      )}
      
      <div className="p-6 overflow-x-auto">
        <div className="whitespace-pre-wrap break-words leading-relaxed text-gray-300 font-sans">
          {diffResult.map((part, index) => {
            // Style based on diff type
            const style = part.added 
              ? "bg-[#2ea04326] text-green-300 border-b border-green-500/20" 
              : part.removed 
                ? "bg-[#da363326] text-red-300 line-through opacity-60 border-b border-red-500/20 select-none" 
                : "opacity-90";

            // Render newline as explicit <br> if needed, but pre-wrap handles \n
            return (
              <span key={index} className={`${style} rounded-[2px] px-0.5`}>
                {part.value}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
