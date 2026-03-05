import { NodeViewWrapper } from '@tiptap/react';
import { FileText, Download, FileAudio, FileVideo, FileImage, File } from 'lucide-react';
import { resolveImageUrl } from '../../../api/client';

export default function FileNodeView(props) {
  const { node, selected } = props;
  const { src, title, size, type } = node.attrs;

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getIcon = () => {
    if (type?.startsWith('image/')) return <FileImage size={24} className="text-blue-400" />;
    if (type?.startsWith('video/')) return <FileVideo size={24} className="text-purple-400" />;
    if (type?.startsWith('audio/')) return <FileAudio size={24} className="text-pink-400" />;
    if (type?.includes('pdf')) return <FileText size={24} className="text-red-400" />;
    return <File size={24} className="text-gray-400" />;
  };

  // Programmatic download so we can set the correct filename from `title`
  // The HTML `download` attr is ignored by browsers for cross-origin URLs
  const handleDownload = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!src) return;

    const filename = title || src.split('/').pop() || 'download';
    const resolvedSrc = resolveImageUrl(src);

    try {
      const response = await fetch(resolvedSrc);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: open in new tab if fetch fails
      window.open(resolvedSrc, '_blank');
    }
  };

  return (
    <NodeViewWrapper className="file-attachment-node my-4 select-none">
      <div
        className={`flex items-center gap-4 p-4 rounded-xl transition-all group
          ${selected 
            ? 'bg-[var(--color-bg-hover)] border-[var(--color-accent)] ring-1 ring-[var(--color-accent)]' 
            : 'bg-[var(--color-bg-secondary)] border-[var(--color-border-primary)] hover:border-[var(--color-accent)]/50'}
        `}
      >
        <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg">
          {getIcon()}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-[var(--color-text-primary)] truncate text-sm mb-0.5" title={title}>
            {title || 'Untitled File'}
          </h4>
          <p className="text-xs text-[var(--color-text-muted)] font-mono">
            {formatSize(size || 0)} • {type?.split('/')[1]?.toUpperCase() || 'FILE'}
          </p>
        </div>

        <button
          onClick={handleDownload}
          className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] rounded-lg transition-colors"
          title={`Download ${title || 'File'}`}
        >
          <Download size={20} />
        </button>
      </div>
    </NodeViewWrapper>
  );
}

