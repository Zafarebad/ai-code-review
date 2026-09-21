'use client';

import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  error?: string;
  hint?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ options, placeholder, label, error, hint, id, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={id}
            className="text-sm font-medium text-[var(--color-text-secondary)]"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={id}
            className={[
              'w-full appearance-none rounded-[var(--radius-md)] pr-10 pl-3 py-2',
              'bg-[var(--color-surface-4)] border text-[var(--color-text-primary)]',
              'text-sm transition-colors duration-150 cursor-pointer',
              error
                ? 'border-[var(--color-error)] focus:border-[var(--color-error)]'
                : 'border-[var(--color-border)] focus:border-[var(--color-brand-500)]',
              'focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
              className,
            ].join(' ')}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]"
          />
        </div>
        {error && (
          <p role="alert" className="text-xs text-[var(--color-error)]">
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="text-xs text-[var(--color-text-tertiary)]">{hint}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
