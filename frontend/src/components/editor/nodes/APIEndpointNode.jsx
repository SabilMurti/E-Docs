import { NodeViewWrapper } from '@tiptap/react';
import { useState } from 'react';
import { Link2, Pencil } from 'lucide-react';

/**
 * APIEndpointBlock Component
 * 
 * A clean, compact API endpoint documentation block.
 */
export default function APIEndpointBlock({ node, updateAttributes }) {
  const [isEditing, setIsEditing] = useState(false);
  const [method, setMethod] = useState(node.attrs.method || 'GET');
  const [endpoint, setEndpoint] = useState(node.attrs.endpoint || '/api/v1/endpoint');
  const [description, setDescription] = useState(node.attrs.description || 'API endpoint description...');

  const handleSave = () => {
    updateAttributes({ method, endpoint, description });
    setIsEditing(false);
  };

  const methodColors = {
    GET: 'bg-green-500',
    POST: 'bg-blue-500',
    PUT: 'bg-amber-500',
    DELETE: 'bg-red-500',
    PATCH: 'bg-purple-500',
  };

  if (isEditing) {
    return (
      <NodeViewWrapper className="my-2">
        <div className="border border-[var(--color-border-primary)] rounded-lg overflow-hidden">
          <div className="p-3 space-y-3">
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                Method
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full px-2 py-1.5 text-sm bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)]"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                Endpoint
              </label>
              <input
                type="text"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                className="w-full px-2 py-1.5 text-sm font-mono bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-2 py-1.5 text-sm bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] resize-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="flex-1 px-3 py-1.5 text-xs font-medium bg-[var(--color-accent)] text-white rounded hover:bg-[var(--color-accent-hover)] transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 px-3 py-1.5 text-xs font-medium bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] border border-[var(--color-border-primary)] rounded hover:bg-[var(--color-bg-hover)] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper className="my-2">
      <div className="group relative border border-[var(--color-border-primary)] rounded-lg overflow-hidden hover:border-[var(--color-accent)]/50 transition-colors">
        <div className="flex items-center gap-2 px-3 py-2 bg-[var(--color-bg-tertiary)] border-b border-[var(--color-border-primary)]">
          <span className={`px-2 py-0.5 text-[10px] font-bold text-white rounded uppercase ${methodColors[method] || 'bg-gray-500'}`}>
            {method}
          </span>
          <code className="text-xs font-mono text-[var(--color-text-primary)]">
            {endpoint}
          </code>
        </div>
        {description && (
          <div className="px-3 py-2">
            <p className="text-xs text-[var(--color-text-secondary)]">{description}</p>
          </div>
        )}
        
        {/* Edit Button */}
        <button
          onClick={() => setIsEditing(true)}
          className="absolute top-2 right-2 p-1.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-primary)] rounded opacity-0 group-hover:opacity-100 transition-opacity"
          title="Edit endpoint"
        >
          <Pencil size={12} className="text-[var(--color-text-muted)]" />
        </button>
      </div>
    </NodeViewWrapper>
  );
}
