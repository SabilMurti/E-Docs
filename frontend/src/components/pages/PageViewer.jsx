import { FileText, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

function PageViewer({ content }) {
  if (!content) {
    return (
      <div className="text-center py-12 text-[var(--color-text-muted)]">
        No content
      </div>
    );
  }

  // Simple renderer for Tiptap JSON content
  const renderContent = (doc) => {
    if (!doc?.content) return null;
    
    return doc.content.map((node, i) => {
      switch (node.type) {
        case 'paragraph':
          return (
            <p key={i} className="mb-4 leading-relaxed text-[var(--color-text-primary)]">
              {node.content?.map((c, j) => renderText(c, j)) || ''}
            </p>
          );
        case 'heading':
          const level = node.attrs?.level || 1;
          const Tag = `h${level}`;
          const styles = {
            1: 'text-3xl font-bold mb-4 mt-8',
            2: 'text-2xl font-semibold mb-3 mt-6',
            3: 'text-xl font-semibold mb-2 mt-4',
          };
          return (
            <Tag key={i} className={`${styles[level] || styles[1]} text-[var(--color-text-primary)]`}>
              {node.content?.map((c, j) => renderText(c, j)) || ''}
            </Tag>
          );
        case 'bulletList':
          return (
            <ul key={i} className="list-disc list-inside mb-4 space-y-1 text-[var(--color-text-primary)]">
              {node.content?.map((item, j) => (
                <li key={j}>
                  {item.content?.[0]?.content?.map((c, k) => renderText(c, k)) || ''}
                </li>
              ))}
            </ul>
          );
        case 'orderedList':
          return (
            <ol key={i} className="list-decimal list-inside mb-4 space-y-1 text-[var(--color-text-primary)]">
              {node.content?.map((item, j) => (
                <li key={j}>
                  {item.content?.[0]?.content?.map((c, k) => renderText(c, k)) || ''}
                </li>
              ))}
            </ol>
          );
        case 'codeBlock':
          return (
            <pre key={i} className="bg-gray-900 text-gray-100 rounded-lg p-4 mb-4 overflow-x-auto font-mono text-sm">
              <code>{node.content?.map(c => c.text).join('') || ''}</code>
            </pre>
          );
        case 'blockquote':
          return (
            <blockquote key={i} className="border-l-4 border-[var(--color-accent)] pl-4 italic mb-4 text-[var(--color-text-secondary)]">
              {node.content?.map((p, j) => (
                <p key={j}>{p.content?.map((c, k) => renderText(c, k)) || ''}</p>
              ))}
            </blockquote>
          );
        case 'image':
           return (
             <div key={i} className="mb-4">
               <img 
                 src={node.attrs?.src} 
                 alt={node.attrs?.alt || ''} 
                 className="max-w-full h-auto rounded-lg border border-[var(--color-border)]"
                 title={node.attrs?.title}
               />
               {node.attrs?.alt && (
                 <p className="text-center text-sm text-[var(--color-text-secondary)] mt-1">
                   {node.attrs.alt}
                 </p>
               )}
             </div>
           );
        case 'taskList':
           return (
             <ul key={i} className="mb-4 space-y-2">
               {node.content?.map((item, j) => {
                 const checked = item.attrs?.checked;
                 return (
                   <li key={j} className="flex items-start gap-3">
                     <div className={`
                       mt-1 w-4 h-4 rounded border flex items-center justify-center flex-shrink-0
                       ${checked ? 'bg-[var(--color-accent)] border-[var(--color-accent)]' : 'border-[var(--color-text-secondary)]'}
                     `}>
                       {checked && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                     </div>
                     <div className={`flex-1 ${checked ? 'text-[var(--color-text-muted)] line-through' : 'text-[var(--color-text-primary)]'}`}>
                       {item.content?.[0]?.content?.map((c, k) => renderText(c, k)) || ''}
                     </div>
                   </li>
                 );
               })}
             </ul>
           );
        case 'table':
           return (
             <div key={i} className="mb-6 overflow-x-auto rounded-lg border border-[var(--color-border)]">
               <table className="w-full text-left border-collapse">
                 <tbody>
                   {node.content?.map((row, j) => (
                     <tr key={j} className="border-b border-[var(--color-border)] last:border-0">
                       {row.content?.map((cell, k) => {
                         const isHeader = cell.type === 'tableHeader';
                         const Tag = isHeader ? 'th' : 'td';
                         return (
                           <Tag 
                             key={k} 
                             className={`
                               p-3 border-r border-[var(--color-border)] last:border-0
                               ${isHeader ? 'bg-[var(--color-bg-secondary)] font-semibold text-[var(--color-text-primary)]' : 'text-[var(--color-text-primary)]'}
                             `}
                             colSpan={cell.attrs?.colspan || 1}
                             rowSpan={cell.attrs?.rowspan || 1}
                           >
                              {cell.content?.map((p, l) => (
                                <p key={l} className="mb-0">
                                  {p.content?.map((c, m) => renderText(c, m)) || ''}
                                </p>
                              ))}
                           </Tag>
                         );
                       })}
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           );
        case 'horizontalRule':
           return <hr key={i} className="my-8 border-t border-[var(--color-border)]" />;
        default:
          return null;
      }
    });
  };

  const renderText = (node, key) => {
    if (node.type !== 'text') return null;
    
    let text = node.text;
    
    if (node.marks) {
      node.marks.forEach(mark => {
        switch (mark.type) {
          case 'bold':
            text = <strong key={key} className="font-bold">{text}</strong>;
            break;
          case 'italic':
            text = <em key={key} className="italic">{text}</em>;
            break;
          case 'strike':
            text = <s key={key} className="line-through">{text}</s>;
            break;
          case 'code':
            text = <code key={key} className="bg-[var(--color-bg-tertiary)] px-1.5 py-0.5 rounded text-sm font-mono text-[var(--color-accent)]">{text}</code>;
            break;
          case 'link':
            text = (
              <a 
                key={key}
                href={mark.attrs?.href} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[var(--color-accent)] hover:underline inline-flex items-center gap-0.5"
              >
                {text}
                <ExternalLink size={10} className="mb-1" />
              </a>
            );
            break;
        }
      });
    }
    
    return <span key={key}>{text}</span>;
  };

  try {
    const doc = typeof content === 'string' ? JSON.parse(content) : content;
    return <div className="prose max-w-none">{renderContent(doc)}</div>;
  } catch (e) {
    return <div className="text-[var(--color-text-secondary)]">{String(content)}</div>;
  }
}

export default PageViewer;
