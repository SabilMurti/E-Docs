import { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import Button from './Button';

function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger', // 'danger' | 'warning' | 'primary'
  isLoading = false
}) {
  const modalRef = useRef(null);

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

  if (!isOpen) return null;

  const variantColors = {
    danger: {
      icon: 'text-[var(--color-danger)]',
      iconBg: 'bg-[var(--color-danger)]/10',
      button: 'danger'
    },
    warning: {
      icon: 'text-[var(--color-warning)]',
      iconBg: 'bg-[var(--color-warning)]/10',
      button: 'primary'
    },
    primary: {
      icon: 'text-[var(--color-accent)]',
      iconBg: 'bg-[var(--color-accent)]/10',
      button: 'primary'
    }
  };

  const colors = variantColors[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => !isLoading && onClose()}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative w-full max-w-sm bg-[var(--color-bg-elevated)] border border-[var(--color-border-primary)] rounded-xl shadow-xl animate-in fade-in-0 zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-start gap-3 p-4">
          <div className={`w-10 h-10 rounded-full ${colors.iconBg} flex items-center justify-center shrink-0`}>
            <AlertTriangle size={20} className={colors.icon} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[var(--color-text-primary)]">{title}</h3>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">{message}</p>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1 rounded-lg hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] transition-colors disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-4 pt-2">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            {cancelText}
          </Button>
          <Button
            variant={colors.button}
            onClick={onConfirm}
            loading={isLoading}
            className="flex-1"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
