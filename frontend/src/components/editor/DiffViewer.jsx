import { useMemo } from 'react';
import { diffLines, diffWordsWithSpace } from 'diff';

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

// Component to render a parsed diff line with word-level highlights
const DiffLine = ({ line, isAdded, isRemoved, isModAdded, isModRemoved, oldLineText, newLineText }) => {
  const rowBg = isAdded ? 'bg-[#2ea04326]' : isRemoved ? 'bg-[#da363326]' : '';
  const textColor = isAdded ? 'text-[#3fb950]' : isRemoved ? 'text-[#f85149]' : 'text-[#c9d1d9]';
  const sign = isAdded ? '+' : isRemoved ? '-' : ' ';
  const signColor = isAdded ? 'text-[#3fb950]' : isRemoved ? 'text-[#f85149]' : 'text-[#484f58]';

  // If this line is a modified line (part of a replaced chunk), we can do inline word diff
  let content = line;
  if ((isModAdded || isModRemoved) && oldLineText && newLineText) {
      const wordDiff = diffWordsWithSpace(oldLineText, newLineText);
      content = wordDiff.map((part, i) => {
          if (isAdded) {
               // We are rendering the ADDED line, so we highlight added words.
               // Removed words are NOT rendered on this line.
               if (part.added) return <span key={i} className="bg-[#2ea04366] rounded px-0.5">{part.value}</span>;
               if (!part.removed) return <span key={i}>{part.value}</span>;
          } else if (isRemoved) {
               // We are rendering the REMOVED line, so we highlight removed words.
               if (part.removed) return <span key={i} className="bg-[#da363366] rounded px-0.5">{part.value}</span>;
               if (!part.added) return <span key={i}>{part.value}</span>;
          }
          return null;
      });
  }

  return (
    <tr className={`${rowBg} hover:bg-white/5 transition-colors group`}>
      <td className={`w-10 select-none text-center text-[10px] ${signColor} font-bold opacity-50 px-2 border-r border-[#30363d]/50`}>
        {sign}
      </td>
      <td className={`px-4 whitespace-pre-wrap break-words ${textColor} leading-relax py-1`}>
        {content || ' '}
      </td>
    </tr>
  );
};

export default function DiffViewer({ oldContent, newContent }) {
  const diffRows = useMemo(() => {
    const safeOld = parseContent(oldContent);
    const safeNew = parseContent(newContent);

    const text1 = safeOld ? getTextFromJSON(safeOld) : '';
    const text2 = safeNew ? getTextFromJSON(safeNew) : '';
    
    const diffResult = diffLines(text1, text2);
    
    const rows = [];
    
    // Group differences to find "modified" lines instead of just added/removed
    for (let i = 0; i < diffResult.length; i++) {
        const part = diffResult[i];
        const nextPart = diffResult[i + 1];
        
        // If we have a removed followed by an added, it's a modification
        if (part.removed && nextPart && nextPart.added) {
            const oldLines = part.value.split('\n');
            if (oldLines[oldLines.length - 1] === '') oldLines.pop();
            
            const newLines = nextPart.value.split('\n');
            if (newLines[newLines.length - 1] === '') newLines.pop();
            
            // Render removed lines
            oldLines.forEach(line => {
                rows.push({
                    line,
                    isRemoved: true,
                    isModRemoved: true,
                    oldLineText: part.value,
                    newLineText: nextPart.value
                });
            });
            
            // Render added lines
            newLines.forEach(line => {
                rows.push({
                    line,
                    isAdded: true,
                    isModAdded: true,
                    oldLineText: part.value,
                    newLineText: nextPart.value
                });
            });
            
            i++; // Skip the next part since we processed it
        } else {
            const lines = part.value.split('\n');
            if (lines[lines.length - 1] === '') lines.pop(); // Remove trailing empty line 
            
            lines.forEach(line => {
                rows.push({
                    line,
                    isAdded: part.added,
                    isRemoved: part.removed
                });
            });
        }
    }
    
    return rows;
  }, [oldContent, newContent]);

  const isEmptyOld = !oldContent || (typeof oldContent === 'object' && Object.keys(oldContent).length === 0);

  if (!oldContent && !newContent) {
    return <div className="text-gray-500 italic p-4">No content available.</div>;
  }

  if (diffRows.length === 0) {
      return <div className="text-gray-400 p-4">No text changes detected.</div>;
  }

  return (
    <div className="diff-viewer bg-[#0d1117] rounded-lg border border-[#30363d] text-sm font-mono overflow-hidden shadow-2xl">
      <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-[#30363d]">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#238636]" />
          <span className="text-[11px] font-bold text-[#8b949e] uppercase tracking-wider">Source Diff</span>
        </div>
        {isEmptyOld && (
          <span className="text-[10px] bg-[#afb8c133] text-[#8b949e] px-2 py-0.5 rounded">NEW FILE</span>
        )}
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <tbody className="font-mono text-[13px] leading-6">
            {diffRows.map((rowProps, index) => (
              <DiffLine key={index} {...rowProps} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
