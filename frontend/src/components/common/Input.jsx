import { forwardRef } from 'react';

const Input = forwardRef(({ 
  label,
  error,
  className = '',
  ...props 
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`
          w-full px-3 py-2 rounded-lg
          bg-[var(--color-bg-primary)]
          border border-[var(--color-border)]
          text-[var(--color-text-primary)]
          placeholder:text-[var(--color-text-muted)]
          focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent
          transition-all duration-200
          ${error ? 'border-[var(--color-error)] focus:ring-[var(--color-error)]' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-sm text-[var(--color-error)]">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
