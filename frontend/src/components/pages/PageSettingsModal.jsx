import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';

/**
 * PageSettingsModal Component
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal open state
 * @param {Function} props.onClose - Close handler
 * @param {Function} props.onSave - Save handler
 * @param {Object} props.page - Current page data
 */
export default function PageSettingsModal({ isOpen, onClose, onSave, page }) {
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when page changes
  useEffect(() => {
    if (page) {
      setTitle(page.title || '');
      setIcon(page.icon || '');
    }
  }, [page]);

  const handleSave = async () => {
    if (!title.trim()) return;

    setIsSaving(true);
    try {
      await onSave({ title, icon });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveIcon = () => {
    setIcon('');
  };

  // Common icons for quick selection
  const commonIcons = ['📄', '📝', '📊', '📋', '🔧', '⚙️', '📚', '📖', '💡', '🎯', '🚀', '✨'];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Page Settings"
      size="md"
    >
      <div className="space-y-4">
        {/* Page Title */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
            Page Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter page title"
            className="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)]/50 text-sm"
            autoFocus
          />
        </div>

        {/* Page Icon */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
            Page Icon
          </label>
          
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] flex items-center justify-center text-2xl">
              {icon || '📄'}
            </div>
            {icon && (
              <button
                onClick={handleRemoveIcon}
                className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors"
              >
                Remove icon
              </button>
            )}
          </div>

          {/* Icon Input */}
          <input
            type="text"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="Type an emoji or select below"
            className="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)]/50 text-sm mb-3"
            maxLength={2}
          />

          {/* Icon Picker */}
          <div className="grid grid-cols-6 gap-2">
            {commonIcons.map((emoji) => (
              <button
                key={emoji}
                onClick={() => setIcon(emoji)}
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-colors ${
                  icon === emoji
                    ? 'bg-[var(--color-accent)]/20 border-2 border-[var(--color-accent)]'
                    : 'bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] hover:border-[var(--color-accent)]/50'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-6 pt-4 border-t border-[var(--color-border-secondary)]">
        <Button
          variant="secondary"
          onClick={onClose}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={!title.trim() || isSaving}
          className="flex-1"
          loading={isSaving}
        >
          Save Changes
        </Button>
      </div>
    </Modal>
  );
}
