import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
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
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
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
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => !isLoading && onClose()}
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm bg-[var(--color-bg-elevated)] border border-[var(--color-border-primary)] rounded-xl shadow-xl animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border-primary)]">
          <h3 className="font-semibold text-[var(--color-text-primary)]">{title}</h3>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1 rounded-lg hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] transition-colors disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4">
          {message && (
            <p className="text-sm text-[var(--color-text-muted)] mb-3">{message}</p>
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
          <div className="flex gap-3 mt-4">
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
