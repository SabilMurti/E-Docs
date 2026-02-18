import { useEffect, useRef, useState } from 'react';
import { GitBranch, X } from 'lucide-react';
import Button from './Button';
import Input from './Input';

function InputModal({
  isOpen,
  onClose,
  onSubmit,
  title = 'Input',
  message,
  placeholder = '',
  submitText = 'Submit',
  cancelText = 'Cancel',
  defaultValue = '',
  isLoading = false,
  validation
}) {
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
      setError('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, defaultValue]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !isLoading) onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, isLoading]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validation) {
      const validationError = validation(value);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    if (!value.trim()) {
      setError('This field is required');
      return;
    }

    onSubmit(value.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => !isLoading && onClose()}
      />

      {/* Modal Card */}
      <div
        className="relative w-full max-w-sm rounded-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200"
        style={{
          background: 'var(--color-bg-modal)',
          border: '1.5px solid var(--color-border-primary)',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.06)',
        }}
      >
        {/* Accent top bar */}
        <div className="h-1 w-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-hover)]" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border-primary)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-accent-light)] flex items-center justify-center">
              <GitBranch size={16} className="text-[var(--color-accent)]" />
            </div>
            <h3 className="font-semibold text-[var(--color-text-primary)]">{title}</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 rounded-lg hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5">
          {message && (
            <p className="text-sm text-[var(--color-text-secondary)] mb-4 leading-relaxed">
              {message}
            </p>
          )}

          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError('');
            }}
            placeholder={placeholder}
            error={error}
            disabled={isLoading}
          />

          {/* Actions */}
          <div className="flex gap-3 mt-5">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              {cancelText}
            </Button>
            <Button
              type="submit"
              loading={isLoading}
              className="flex-1"
            >
              {submitText}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default InputModal;
