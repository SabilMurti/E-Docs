import { Link } from 'react-router-dom';
import {
  FileText, ExternalLink, CheckSquare, Square, Download,
  FileAudio, FileVideo, FileImage, File,
  Info, CheckCircle2, AlertTriangle, XCircle,
  ChevronRight, ChevronDown, List
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

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
        case 'paragraph':
          if (!node.content || node.content.length === 0) {
            return <div key={i} className="h-4" />;
          }
          return (
            <p key={i} className="mb-4 leading-7 text-[var(--color-text-primary)]">
              {node.content.map((c, j) => renderText(c, j))}
            </p>
          );
          
        case 'heading': {
          const level = node.attrs?.level || 1;
          const Tag = `h${level}`;
          const styles = {
            1: 'text-3xl font-extrabold mb-6 mt-10 pb-2 border-b border-[var(--color-border-secondary)]',
            2: 'text-2xl font-bold mb-4 mt-8 pb-1 border-b border-[var(--color-border-primary)]/50',
            3: 'text-xl font-bold mb-3 mt-6',
            4: 'text-lg font-semibold mb-2 mt-4',
          };
          
          return (
            <Tag key={i} className={`${styles[level] || styles[1]} text-[var(--color-text-primary)] scroll-mt-20`} id={`heading-${i}`}>
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

        case 'codeBlock':
          return (
            <div key={i} className="relative group mb-6">
              <pre className="bg-[#0d1117] border border-[var(--color-border-primary)] text-gray-200 rounded-lg p-4 overflow-x-auto font-mono text-sm leading-normal shadow-sm">
                <code>{node.content?.map(c => c.text).join('') || ''}</code>
              </pre>
              <div className="absolute top-2 right-2 text-xs text-gray-500 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                {node.attrs?.language || 'text'}
              </div>
            </div>
          );

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

        case 'image':
           return (
             <figure key={i} className="my-8 text-center">
               <div className="inline-block relative overflow-hidden rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-tertiary)]"
                    style={{ width: node.attrs?.width ? (typeof node.attrs.width === 'number' ? `${node.attrs.width}px` : node.attrs.width) : '100%', maxWidth: '100%' }}>
                 <img 
                   src={node.attrs?.src} 
                   alt={node.attrs?.alt || ''} 
                   className="w-full h-auto object-cover"
                   loading="lazy"
                 />
               </div>
             </figure>
           );

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
            text = <strong key={key} className="font-bold text-[var(--color-text-primary)]">{text}</strong>;
            break;
          case 'italic':
            text = <em key={key} className="italic">{text}</em>;
            break;
          case 'strike':
            text = <s key={key} className="line-through decoration-[var(--color-text-muted)]">{text}</s>;
            break;
          case 'underline':
             text = <u key={key} className="decoration-[var(--color-accent)] underline-offset-2">{text}</u>;
             break;
          case 'code':
            text = <code key={key} className="bg-[var(--color-bg-tertiary)] px-1.5 py-0.5 rounded text-[0.9em] font-mono text-[var(--color-accent)] border border-[var(--color-border-primary)]">{text}</code>;
            break;
          case 'link':
            text = (
              <a 
                key={key}
                href={mark.attrs?.href} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[var(--color-accent)] hover:underline inline-flex items-center gap-0.5 font-medium transition-colors hover:text-[var(--color-accent-hover)] cursor-pointer"
              >
                {text}
                <ExternalLink size={10} className="mb-1 opacity-50" />
              </a>
            );
            break;
          case 'highlight':
             text = <mark key={key} className="bg-yellow-500/20 text-yellow-200 rounded px-0.5">{text}</mark>;
             break;
          case 'textStyle':
             const style = {};
             if (mark.attrs.color) style.color = mark.attrs.color;
             if (mark.attrs.fontSize) {
                 let fs = mark.attrs.fontSize;
                 // Ensure px unit
                 if (typeof fs === 'number' || (typeof fs === 'string' && /^\d+$/.test(fs))) {
                     fs += 'px';
                 }
                 style.fontSize = fs;
             }
             if (Object.keys(style).length > 0) {
                 text = <span style={style}>{text}</span>;
             }
             break;
        }
      });
    }
    
    return <span key={key}>{text}</span>;
  };

  try {
    const doc = typeof content === 'string' ? JSON.parse(content) : content;
    return <div className="prose prose-invert max-w-none">{renderContent(doc)}</div>;
  } catch (e) {
    return <div className="text-[var(--color-text-secondary)] whitespace-pre-wrap">{String(content)}</div>;
  }
}

export default PageViewer;
