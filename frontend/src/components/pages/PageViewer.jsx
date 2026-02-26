import { Link } from 'react-router-dom';
import {
  FileText, ExternalLink, CheckSquare, Square, Download,
  FileAudio, FileVideo, FileImage, File,
  Info, CheckCircle2, AlertTriangle, XCircle,
  ChevronRight, ChevronDown, List,
  Copy, Check
} from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, X, Layers } from 'lucide-react';
import { resolveImageUrl } from '../../api/client';

// Copy button with visual confirmation for code blocks
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback - silently fail
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-xs px-2 py-1 rounded transition-all duration-150"
      style={{
        color: copied ? '#10b981' : '#6e7681',
        background: copied ? 'rgba(16,185,129,0.1)' : 'transparent',
      }}
      title="Copy code"
    >
      {copied ? (
        <><Check size={12} /><span>Copied!</span></>
      ) : (
        <><Copy size={12} /><span>Copy</span></>
      )}
    </button>
  );
}


function ViewerTabs({ node, renderContent }) {
  const [activeTab, setActiveTab] = useState(node.attrs?.activeTab || 0);
  const tabs = node.content || [];

  return (
    <div className="tabs-workspace my-8 relative rounded-xl border border-[var(--color-border-primary)] shadow-md overflow-hidden bg-[var(--color-bg-primary)]">
      {/* Tab Bar */}
      <div className="flex items-center gap-0.5 border-b border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] px-2 pt-2 overflow-x-auto no-scrollbar">
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(index)}
            className={`
              flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-all duration-150 border-t border-l border-r outline-none select-none whitespace-nowrap
              ${index === activeTab 
                ? 'bg-[var(--color-bg-primary)] border-[var(--color-border-primary)] text-[var(--color-text-primary)] -mb-[1px] z-10 shadow-[0_-2px_0_0_var(--color-accent)]' 
                : 'bg-transparent border-transparent text-[var(--color-text-muted)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]'
              }
            `}
          >
            {tab.attrs?.title || `Tab ${index + 1}`}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="bg-[var(--color-bg-primary)] p-6">
        {tabs[activeTab] && (
          <div className="animate-in fade-in slide-in-from-bottom-1 duration-200">
            {renderContent(tabs[activeTab])}
          </div>
        )}
      </div>
    </div>
  );
}

function PageViewer({ content }) {
  if (!content) {
    return (
      <div className="text-center py-12 text-[var(--color-text-muted)] italic">
        No content available
      </div>
    );
  }

  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type) => {
    if (type?.startsWith('image/')) return <FileImage size={24} className="text-blue-400" />;
    if (type?.startsWith('video/')) return <FileVideo size={24} className="text-purple-400" />;
    if (type?.startsWith('audio/')) return <FileAudio size={24} className="text-pink-400" />;
    if (type?.includes('pdf')) return <FileText size={24} className="text-red-400" />;
    return <File size={24} className="text-gray-400" />;
  };

  // Simple renderer for Tiptap JSON content
  const renderContent = (doc) => {
    if (!doc?.content) return null;
    
    return doc.content.map((node, i) => {
      switch (node.type) {
        case 'paragraph': {
          const textAlign = node.attrs?.textAlign || 'left';
          
          if (!node.content || node.content.length === 0) {
            return <div key={i} className="h-4" style={{ textAlign }} />;
          }
          return (
            <p key={i} className="mb-4 leading-7 text-[var(--color-text-primary)]" style={{ textAlign }}>
              {node.content.map((c, j) => {
                if (c.type === 'text') return renderText(c, j);
                if (c.type === 'image') {
                  const imgSrc = resolveImageUrl(c.attrs?.src);
                  return (
                    <img 
                      key={j}
                      src={imgSrc} 
                      alt={c.attrs?.alt || ''} 
                      className="inline-block rounded-lg shadow-sm"
                      style={{ 
                        maxWidth: '100%', 
                        width: c.attrs?.width || 'auto',
                        height: 'auto'
                      }}
                    />
                  );
                }
                return null;
              })}
            </p>
          );
        }
          
        case 'heading': {
          const level = node.attrs?.level || 1;
          const textAlign = node.attrs?.textAlign || 'left';
          const Tag = `h${level}`;
          const styles = {
            1: 'text-3xl font-extrabold mb-6 mt-10 pb-2 border-b border-[var(--color-border-secondary)]',
            2: 'text-2xl font-bold mb-4 mt-8 pb-1 border-b border-[var(--color-border-primary)]/50',
            3: 'text-xl font-bold mb-3 mt-6',
            4: 'text-lg font-semibold mb-2 mt-4',
          };
          
          return (
            <Tag 
              key={i} 
              className={`${styles[level] || styles[1]} text-[var(--color-text-primary)] scroll-mt-20`} 
              id={`heading-${i}`}
              style={{ textAlign }}
            >
              {node.content?.map((c, j) => renderText(c, j)) || ''}
            </Tag>
          );
        }

        case 'bulletList':
          return (
            <ul key={i} className="list-disc list-outside ml-6 mb-4 space-y-1.5 text-[var(--color-text-primary)] marker:text-[var(--color-text-muted)]">
              {node.content?.map((item, j) => (
                <li key={j} className="pl-1">
                  {item.content?.map((p, k) => (
                     <span key={k}>{p.content?.map((c, l) => renderText(c, l))}</span>
                  ))}
                </li>
              ))}
            </ul>
          );

        case 'orderedList':
          return (
            <ol key={i} className="list-decimal list-outside ml-6 mb-4 space-y-1.5 text-[var(--color-text-primary)] marker:text-[var(--color-text-muted)] font-medium">
              {node.content?.map((item, j) => (
                <li key={j} className="pl-1 font-normal">
                  {item.content?.map((p, k) => (
                     <span key={k}>{p.content?.map((c, l) => renderText(c, l))}</span>
                  ))}
                </li>
              ))}
            </ol>
          );

        case 'taskList':
           return (
             <ul key={i} className="mb-4 space-y-2">
               {node.content?.map((item, j) => {
                 const checked = item.attrs?.checked;
                 return (
                   <li key={j} className="flex items-start gap-3 group">
                     <div className={`
                       mt-1 w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors
                       ${checked ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'}
                     `}>
                       {checked ? <CheckSquare size={18} /> : <Square size={18} />}
                     </div>
                     <div className={`flex-1 leading-relaxed ${checked ? 'text-[var(--color-text-muted)] line-through decoration-[var(--color-border-secondary)]' : 'text-[var(--color-text-primary)]'}`}>
                       {item.content?.[0]?.content?.map((c, k) => renderText(c, k)) || ''}
                     </div>
                   </li>
                 );
               })}
             </ul>
           );


        case 'codeBlock': {
          const codeText = node.content?.map(c => c.text).join('') || '';
          const lang = node.attrs?.language || 'text';
          return (
            <div key={i} className="relative group mb-6 rounded-xl overflow-hidden shadow-sm" style={{ background: '#0d1117', border: '1px solid #30363d' }}>
              {/* Code Block Header */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: '#21262d', background: '#161b22' }}>
                <span className="text-xs font-mono font-medium" style={{ color: '#8b949e' }}>{lang}</span>
                <CopyButton text={codeText} />
              </div>
              <pre className="p-4 overflow-x-auto font-mono text-sm leading-relaxed" style={{ color: '#e6edf3', margin: 0, background: 'transparent' }}>
                <code>{codeText}</code>
              </pre>
            </div>
          );
        }


        case 'blockquote':
          return (
            <blockquote key={i} className="border-l-4 border-[var(--color-accent)] pl-5 py-1 my-6 italic text-[var(--color-text-secondary)] bg-[var(--color-bg-tertiary)]/30 rounded-r-lg">
              {node.content?.map((p, j) => (
                <p key={j} className="mb-2 last:mb-0">
                  {p.content?.map((c, k) => renderText(c, k)) || ''}
                </p>
              ))}
            </blockquote>
          );

        case 'image': {
           const imgSrc = resolveImageUrl(node.attrs?.src);
           return (
             <figure key={i} className="my-8 text-center">
               <div className="inline-block relative overflow-hidden rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-tertiary)]"
                    style={{ width: node.attrs?.width ? (typeof node.attrs.width === 'number' ? `${node.attrs.width}px` : node.attrs.width) : '100%', maxWidth: '100%' }}>
                 <img 
                   src={imgSrc} 
                   alt={node.attrs?.alt || ''} 
                   className="w-full h-auto object-cover"
                   loading="lazy"
                   onError={(e) => {
                     // Show broken image placeholder if URL fails
                     e.currentTarget.style.opacity = '0.3';
                   }}
                 />
               </div>
               {node.attrs?.caption && (
                 <figcaption className="mt-2 text-sm text-[var(--color-text-muted)] italic">
                   {node.attrs.caption}
                 </figcaption>
               )}
             </figure>
           );
        }

        case 'youtube':
           return (
             <div key={i} className="my-8 aspect-video rounded-lg overflow-hidden shadow-sm border border-[var(--color-border-primary)] bg-black">
               <iframe 
                 src={node.attrs.src} 
                 width="100%" 
                 height="100%" 
                 allowFullScreen 
                 frameBorder="0"
                 title="YouTube video"
                 allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
               />
             </div>
           );

        case 'fileAttachment':
            return (
              <a 
                key={i} 
                href={node.attrs.src} 
                download 
                target="_blank" 
                rel="noopener noreferrer"
                className="block mb-6 no-underline group"
              >
                <div className="flex items-center gap-4 p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] transition-all group-hover:border-[var(--color-accent)] group-hover:shadow-md">
                    <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg">
                        {getFileIcon(node.attrs.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-[var(--color-text-primary)] truncate text-sm mb-0.5">
                            {node.attrs.title || 'Untitled File'}
                        </h4>
                        <p className="text-xs text-[var(--color-text-muted)] font-mono">
                            {formatSize(node.attrs.size || 0)} • {node.attrs.type?.split('/')[1]?.toUpperCase() || 'FILE'}
                        </p>
                    </div>
                    <div className="p-2 text-[var(--color-text-muted)] group-hover:text-[var(--color-text-primary)] group-hover:bg-[var(--color-bg-hover)] rounded-lg transition-colors">
                        <Download size={20} />
                    </div>
                </div>
              </a>
            );

        case 'horizontalRule':
           return <hr key={i} className="my-10 border-t border-[var(--color-border-secondary)]" />;

        case 'hardBreak':
           return <br key={i} />;

         case 'table': {
            const tableStyle = node.attrs?.style || 'default';
            return (
              <div key={i} className={`
                mb-8 overflow-x-auto rounded-lg border border-[var(--color-border-primary)] shadow-sm
                ${tableStyle === 'bordered' ? 'ring-1 ring-[var(--color-border-primary)]' : ''}
              `}>
                <table className="w-full text-left border-collapse text-sm">
                  <tbody>
                    {node.content?.map((row, j) => (
                      <tr 
                        key={j} 
                        className={`
                          border-b border-[var(--color-border-primary)] last:border-0 transition-colors
                          ${tableStyle === 'striped' && j % 2 === 1 ? 'bg-[var(--color-bg-secondary)]/30' : ''}
                          hover:bg-[var(--color-bg-secondary)]/50
                        `}
                      >
                        {row.content?.map((cell, k) => {
                          const isHeader = cell.type === 'tableHeader';
                          const Tag = isHeader ? 'th' : 'td';
                          const bgColor = cell.attrs?.backgroundColor;
                          
                          let cellClass = 'p-3 border-r border-[var(--color-border-primary)] last:border-0 align-top';
                          if (isHeader) {
                            cellClass += ' bg-[var(--color-bg-tertiary)] font-semibold text-[var(--color-text-primary)]';
                            if (tableStyle === 'minimal') cellClass = 'p-3 border-b-2 border-[var(--color-border-primary)] font-semibold text-[var(--color-text-primary)]';
                          } else {
                            cellClass += ' text-[var(--color-text-secondary)]';
                            if (tableStyle === 'minimal') cellClass = 'p-3 border-b border-[var(--color-border-secondary)] text-[var(--color-text-secondary)] last:border-b-0';
                          }

                          return (
                            <Tag
                              key={k}
                              className={cellClass}
                              style={bgColor ? { backgroundColor: bgColor } : {}}
                              colSpan={cell.attrs?.colspan || 1}
                              rowSpan={cell.attrs?.rowspan || 1}
                            >
                              {cell.content?.map((child, l) => {
                                // Render based on child node type
                                if (child.type === 'paragraph') {
                                  return (
                                    <p key={l} className="mb-0 last:mb-0">
                                      {child.content?.map((c, m) => renderText(c, m)) || ''}
                                    </p>
                                  );
                                } else if (child.type === 'text') {
                                  return renderText(child, l);
                                } else {
                                  // Render other node types
                                  return renderText(child, l);
                                }
                              })}
                            </Tag>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
         }

         case 'callout': {
           const type = node.attrs?.type || 'info';
           const icons = { info: Info, success: CheckCircle2, warning: AlertTriangle, danger: XCircle };
           const Icon = icons[type];
           const styles = {
             info: 'bg-blue-500/10 border-blue-500/50 text-blue-400',
             success: 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400',
             warning: 'bg-amber-500/10 border-amber-500/50 text-amber-400',
             danger: 'bg-red-500/10 border-red-500/50 text-red-400',
           };
           return (
             <div key={i} className={`flex gap-3 p-4 my-6 rounded-xl border-l-4 ${styles[type]}`}>
               <Icon size={20} className="flex-shrink-0" />
               <div className="flex-1 min-w-0 prose-p:my-0 prose-p:leading-relaxed">
                 {renderContent(node)}
               </div>
             </div>
           );
         }

         case 'card':
           return (
             <div key={i} className="bg-[var(--color-bg-primary)] p-6 rounded-xl border border-[var(--color-border-primary)] shadow-sm my-6">
                {renderContent(node)}
             </div>
           );

         case 'columns': {
           const layout = node.attrs?.layout || 'two-columns';
           const gridClass = layout === 'three-columns' ? 'grid-cols-1 md:grid-cols-3' : 
                            layout === 'sidebar-left' ? 'grid-cols-1 md:grid-cols-[1fr_2fr]' :
                            layout === 'sidebar-right' ? 'grid-cols-1 md:grid-cols-[2fr_1fr]' :
                            'grid-cols-1 md:grid-cols-2';
           return (
             <div key={i} className={`grid ${gridClass} gap-6 my-8`}>
               {renderContent(node)}
             </div>
           );
         }

         case 'column':
           return <div key={i} className="min-w-0">{renderContent(node)}</div>;

         case 'toggle':
           return (
             <details key={i} className="group border border-[var(--color-border-primary)] rounded-xl overflow-hidden my-6">
               <summary className="p-4 bg-[var(--color-bg-secondary)] cursor-pointer hover:bg-[var(--color-bg-hover)] transition-colors font-semibold flex items-center gap-2">
                 <ChevronRight size={16} className="group-open:rotate-90 transition-transform" />
                 {node.attrs?.summary || 'Expand to view'}
               </summary>
               <div className="p-4 border-t border-[var(--color-border-primary)] bg-[var(--color-bg-primary)]">
                 {renderContent(node)}
               </div>
             </details>
           );

         case 'excalidraw':
           return (
             <div key={i} className="excalidraw-node my-8 border border-[var(--color-border-primary)] rounded-xl overflow-hidden bg-white dark:bg-[#121212]">
                {node.attrs?.svgData ? (
                  <div 
                    className="p-4 flex justify-center items-center"
                    dangerouslySetInnerHTML={{ __html: node.attrs.svgData }}
                  />
                ) : (
                  <div className="p-12 text-center text-[var(--color-text-muted)] italic">
                    Flowchart placeholder
                  </div>
                )}
             </div>
           );

        case 'tabs':
          return <ViewerTabs key={i} node={node} renderContent={renderContent} />;

        case 'tabItem':
          return <div key={i}>{renderContent(node)}</div>;

        default:
          return null;
      }
    });
  };

  const renderText = (node, key) => {
    if (node.type !== 'text') return null;
    
    let content = node.text;
    let hasMarks = node.marks && node.marks.length > 0;
    
    if (hasMarks) {
      node.marks.forEach((mark, mIdx) => {
        const mKey = `${key}-${mIdx}`;
        switch (mark.type) {
          case 'bold':
            content = <strong key={mKey} className="font-bold text-[var(--color-text-primary)]">{content}</strong>;
            break;
          case 'italic':
            content = <em key={mKey} className="italic">{content}</em>;
            break;
          case 'strike':
            content = <s key={mKey} className="line-through decoration-[var(--color-text-muted)]">{content}</s>;
            break;
          case 'underline':
            content = <u key={mKey} className="decoration-[var(--color-accent)] underline-offset-2">{content}</u>;
            break;
          case 'code':
            content = <code key={mKey} className="bg-[var(--color-bg-tertiary)] px-1.5 py-0.5 rounded text-[0.9em] font-mono text-[var(--color-accent)] border border-[var(--color-border-primary)]">{content}</code>;
            break;
          case 'link':
            content = (
              <a 
                key={mKey}
                href={mark.attrs?.href} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[var(--color-accent)] hover:underline inline-flex items-center gap-0.5 font-medium transition-colors hover:text-[var(--color-accent-hover)] cursor-pointer"
              >
                {content}
                <ExternalLink size={10} className="mb-1 opacity-50" />
              </a>
            );
            break;
          case 'highlight':
            content = <mark key={mKey} className="bg-yellow-500/20 text-yellow-200 rounded px-0.5">{content}</mark>;
            break;
          case 'textStyle': {
            const style = {};
            if (mark.attrs?.color) style.color = mark.attrs.color;
            if (mark.attrs?.fontSize) {
              let fs = mark.attrs.fontSize;
              if (typeof fs === 'number' || (typeof fs === 'string' && /^\d+$/.test(fs))) {
                fs += 'px';
              }
              style.fontSize = fs;
            }
            if (Object.keys(style).length > 0) {
              content = <span key={mKey} style={style}>{content}</span>;
            }
            break;
          }
          default:
            break;
        }
      });
      // Return the marked content directly (already has a key from the last mark)
      return content;
    }
    
    // Plain text — no extra span wrapper needed
    return <span key={key}>{content}</span>;
  };

  try {
    const doc = typeof content === 'string' ? JSON.parse(content) : content;
    return <div className="page-viewer">{renderContent(doc)}</div>;
  } catch (e) {
    return <div className="text-[var(--color-text-secondary)] whitespace-pre-wrap">{String(content)}</div>;
  }
}

export default PageViewer;
