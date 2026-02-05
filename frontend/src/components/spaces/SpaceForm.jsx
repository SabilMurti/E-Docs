import { useState } from 'react';
import Button from '../common/Button';
import Input from '../common/Input';
import Modal from '../common/Modal';

function SpaceForm({ isOpen, onClose, onSubmit, initialData = null }) {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [visibility, setVisibility] = useState(initialData?.visibility || 'private');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const isEditing = !!initialData;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Space name is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onSubmit({ name, description, visibility });
      onClose();
      setName('');
      setDescription('');
      setVisibility('private');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Space' : 'Create New Space'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSubmit}
            isLoading={isLoading}
          >
            {isEditing ? 'Save Changes' : 'Create Space'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <Input
          label="Space Name"
          placeholder="My Documentation"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />

        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of this documentation space..."
            rows={3}
            className="
              w-full px-3 py-2 rounded-lg
              bg-[var(--color-bg-primary)]
              border border-[var(--color-border)]
              text-[var(--color-text-primary)]
              placeholder:text-[var(--color-text-muted)]
              focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent
              resize-none
            "
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
            Visibility
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="visibility"
                value="private"
                checked={visibility === 'private'}
                onChange={(e) => setVisibility(e.target.value)}
                className="w-4 h-4 text-[var(--color-accent)]"
              />
              <span className="text-sm text-[var(--color-text-primary)]">Private</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="visibility"
                value="public"
                checked={visibility === 'public'}
                onChange={(e) => setVisibility(e.target.value)}
                className="w-4 h-4 text-[var(--color-accent)]"
              />
              <span className="text-sm text-[var(--color-text-primary)]">Public</span>
            </label>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default SpaceForm;
