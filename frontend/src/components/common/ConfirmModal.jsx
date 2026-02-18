import { useEffect, useRef } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
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

  const variantConfig = {
    danger: {
      icon: Trash2,
      iconColor: 'text-red-500',
      iconBg: 'bg-red-50 dark:bg-red-500/10',
      headerBorder: 'border-red-100 dark:border-red-500/20',
      topBar: 'bg-gradient-to-r from-red-500 to-red-400',
      buttonVariant: 'danger',
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-amber-500',
      iconBg: 'bg-amber-50 dark:bg-amber-500/10',
      headerBorder: 'border-amber-100 dark:border-amber-500/20',
      topBar: 'bg-gradient-to-r from-amber-500 to-amber-400',
      buttonVariant: 'primary',
    },
    primary: {
      icon: AlertTriangle,
      iconColor: 'text-[var(--color-accent)]',
      iconBg: 'bg-[var(--color-accent-light)]',
      headerBorder: 'border-[var(--color-border-primary)]',
      topBar: 'bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-hover)]',
      buttonVariant: 'primary',
    },
  };

  const config = variantConfig[variant] ?? variantConfig.danger;
  const IconComponent = config.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => !isLoading && onClose()}
      />

      {/* Modal Card */}
      <div
        ref={modalRef}
        className="relative w-full max-w-sm rounded-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200"
        style={{
          background: 'var(--color-bg-modal)',
          border: '1.5px solid var(--color-border-primary)',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.06)',
        }}
      >
        {/* Colored accent top bar */}
        <div className={`h-1 w-full ${config.topBar}`} />

        {/* Header */}
        <div className={`flex items-start gap-4 p-5 border-b ${config.headerBorder}`}>
          {/* Icon badge */}
          <div className={`w-10 h-10 rounded-xl ${config.iconBg} flex items-center justify-center shrink-0 mt-0.5`}>
            <IconComponent size={20} className={config.iconColor} />
          </div>

          {/* Title + message */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base text-[var(--color-text-primary)] leading-tight">
              {title}
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1.5 leading-relaxed">
              {message}
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 rounded-lg hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors disabled:opacity-50 shrink-0"
            aria-label="Close dialog"
          >
            <X size={16} />
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 p-4" style={{ background: 'var(--color-bg-secondary)' }}>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            {cancelText}
          </Button>
          <Button
            variant={config.buttonVariant}
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
