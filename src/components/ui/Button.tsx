'use client';

import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size    = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles: Record<Variant, string> = {
  primary:
    'bg-[var(--color-brand-600)] text-white hover:bg-[var(--color-brand-500)] ' +
    'active:bg-[var(--color-brand-700)] shadow-sm ' +
    'disabled:bg-[var(--color-brand-900)] disabled:text-[var(--color-text-disabled)]',
  secondary:
    'bg-[var(--color-surface-4)] text-[var(--color-text-primary)] ' +
    'border border-[var(--color-border)] hover:bg-[var(--color-surface-3)] ' +
    'active:bg-[var(--color-surface-2)]',
  ghost:
    'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-3)] ' +
    'hover:text-[var(--color-text-primary)] active:bg-[var(--color-surface-2)]',
  danger:
    'bg-[var(--color-error)] text-white hover:opacity-90 active:opacity-100 ' +
    'disabled:opacity-40',
};

const sizeStyles: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-11 px-6 text-base gap-2',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        className={[
          'inline-flex items-center justify-center font-medium rounded-[var(--radius-md)]',
          'transition-all duration-150 cursor-pointer select-none',
          'focus-visible:outline-2 focus-visible:outline-[var(--color-brand-500)]',
          'disabled:cursor-not-allowed',
          variantStyles[variant],
          sizeStyles[size],
          className,
        ].join(' ')}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="shrink-0 animate-spin" size={size === 'sm' ? 14 : 16} />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
