import { forwardRef } from 'react';

const Input = forwardRef(function Input(
  { 
    label,
    error,
    className = '',
    ...props 
  }, 
  ref
) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`
          w-full px-3 py-2 text-sm
          bg-[var(--color-bg-secondary)] 
          border rounded-lg
          text-[var(--color-text-primary)] 
          placeholder-[var(--color-text-muted)]
          transition-colors duration-150
          focus:outline-none
          ${error 
            ? 'border-[var(--color-danger)] focus:border-[var(--color-danger)]' 
            : 'border-[var(--color-border-primary)] focus:border-[var(--color-accent)]'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1 text-xs text-[var(--color-danger)]">{error}</p>
      )}
    </div>
  );
});

export default Input;
