import { NodeViewWrapper } from '@tiptap/react';
import { FileText, Download, FileAudio, FileVideo, FileImage, File } from 'lucide-react';
import { ReactNodeViewRenderer } from '@tiptap/react';

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

  return (
    <NodeViewWrapper className="file-attachment-node my-4 select-none">
      <div 
        className={`flex items-center gap-4 p-4 rounded-xl bg-[#161b22] border transition-all group hover:bg-[#1f242c]
          ${selected ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-700 hover:border-gray-600'}
        `}
      >
        <div className="p-3 bg-gray-800 rounded-lg">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-white truncate text-sm mb-0.5" title={title}>
            {title || 'Untitled File'}
          </h4>
          <p className="text-xs text-gray-500 font-mono">
            {formatSize(size || 0)} • {type?.split('/')[1]?.toUpperCase() || 'FILE'}
          </p>
        </div>

        <a 
          href={src} 
          download 
          target="_blank" 
          rel="noopener noreferrer"
          className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          title="Download File"
          onClick={(e) => e.stopPropagation()}
        >
          <Download size={20} />
        </a>
      </div>
    </NodeViewWrapper>
  );
}
