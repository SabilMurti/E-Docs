import { forwardRef } from 'react';

const Button = forwardRef(({ 
  children, 
  variant = 'primary', 
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  ...props 
}, ref) => {
  const baseStyles = `
    inline-flex items-center justify-center font-medium rounded-lg
    transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const variants = {
    primary: `
      bg-[var(--color-accent)] text-white
      hover:bg-[var(--color-accent-hover)]
      focus:ring-[var(--color-accent)]
    `,
    secondary: `
      bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]
      border border-[var(--color-border)]
      hover:bg-[var(--color-bg-tertiary)] hover:border-[var(--color-border-hover)]
      focus:ring-[var(--color-accent)]
    `,
    ghost: `
      text-[var(--color-text-secondary)]
      hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)]
      focus:ring-[var(--color-accent)]
    `,
    danger: `
      bg-[var(--color-error)] text-white
      hover:opacity-90
      focus:ring-[var(--color-error)]
    `,
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2',
  };

  return (
    <button
      ref={ref}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
