import { useState } from 'react';
import CustomModal from '../common/CustomModal';
import { ImageIcon, Link2, Upload, X, Loader2 } from 'lucide-react';
import { uploadFile } from '../../api/upload';
import { resolveImageUrl } from '../../api/client';
import { toast } from 'sonner';

/**
 * MediaInsertModal - Modal for inserting images (upload or URL)
 */
export default function MediaInsertModal({ isOpen, onClose, onInsert, type = 'image' }) {
  const [mode, setMode] = useState('upload'); // 'upload' or 'url'
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = () => {
    if (mode === 'url' && imageUrl.trim()) {
      onInsert({
        type: 'image',
        src: imageUrl.trim(),
        alt: 'Image'
      });
      handleClose();
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const data = await uploadFile(file);
      onInsert({
        type: 'image',
        src: data.url, // Store relative path
        alt: data.filename || file.name,
      });
      handleClose();
    } catch (err) {
      console.error('Upload failed:', err);
      toast.error('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setMode('upload');
    setImageUrl('');
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && mode === 'url') {
      handleSubmit();
    }
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={handleClose}
      title={type === 'image' ? 'Insert Image' : 'Insert Media'}
    >
      <div className="space-y-4" onKeyDown={handleKeyDown}>
        {/* Mode Toggle */}
        <div className="flex gap-2 p-1 bg-[var(--color-bg-tertiary)] rounded-lg">
          <button
            onClick={() => setMode('upload')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === 'upload'
                ? 'bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] shadow-sm'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <Upload size={16} />
            Upload
          </button>
          <button
            onClick={() => setMode('url')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === 'url'
                ? 'bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] shadow-sm'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <Link2 size={16} />
            URL
          </button>
        </div>

        {/* Upload Mode */}
        {mode === 'upload' && (
          <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            isUploading
              ? 'border-[var(--color-accent)]/50 bg-[var(--color-accent)]/5'
              : 'border-[var(--color-border-primary)] hover:border-[var(--color-accent)]/50'
          }`}>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              id="image-upload"
              disabled={isUploading}
            />
            <label
              htmlFor="image-upload"
              className={`flex flex-col items-center ${isUploading ? 'cursor-wait' : 'cursor-pointer'}`}
            >
              {isUploading ? (
                <>
                  <Loader2 size={48} className="text-[var(--color-accent)] mb-3 animate-spin" />
                  <p className="text-sm font-medium text-[var(--color-text-primary)] mb-1">
                    Uploading...
                  </p>
                </>
              ) : (
                <>
                  <ImageIcon size={48} className="text-[var(--color-text-muted)] mb-3" />
                  <p className="text-sm font-medium text-[var(--color-text-primary)] mb-1">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    SVG, PNG, JPG or GIF (max. 10MB)
                  </p>
                </>
              )}
            </label>
          </div>
        )}

        {/* URL Mode */}
        {mode === 'url' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
                Image URL
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)]/50 focus:ring-1 focus:ring-[var(--color-accent)]/50"
                autoFocus
              />
            </div>

            {imageUrl && (
              <div className="border border-[var(--color-border-primary)] rounded-lg overflow-hidden">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full h-48 object-contain bg-[var(--color-bg-tertiary)]"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="2"%3E%3Crect x="3" y="3" width="18" height="18" rx="2" ry="2"/%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"/%3E%3Cpolyline points="21 15 16 10 5 21"/%3E%3C/svg%3E';
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 text-sm font-medium bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] border border-[var(--color-border-primary)] rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors"
          >
            Cancel
          </button>
          {mode === 'url' && (
            <button
              onClick={handleSubmit}
              disabled={!imageUrl.trim()}
              className="flex-1 px-4 py-2 text-sm font-medium bg-[var(--color-accent)] text-white rounded-lg hover:bg-[var(--color-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Insert
            </button>
          )}
        </div>
      </div>
    </CustomModal>
  );
}
