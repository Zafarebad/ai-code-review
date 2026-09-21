type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'brand'
  | 'outline';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  default:
    'bg-[var(--color-surface-4)] text-[var(--color-text-secondary)] border border-[var(--color-border)]',
  success:
    'bg-[oklch(0.72_0.18_155/0.15)] text-[var(--color-success)] border border-[oklch(0.72_0.18_155/0.3)]',
  warning:
    'bg-[oklch(0.80_0.17_80/0.15)] text-[var(--color-warning)] border border-[oklch(0.80_0.17_80/0.3)]',
  error:
    'bg-[oklch(0.65_0.22_25/0.15)] text-[var(--color-error)] border border-[oklch(0.65_0.22_25/0.3)]',
  info:
    'bg-[oklch(0.65_0.15_230/0.15)] text-[var(--color-info)] border border-[oklch(0.65_0.15_230/0.3)]',
  brand:
    'bg-[var(--color-brand-900)] text-[var(--color-brand-300)] border border-[var(--color-brand-800)]',
  outline:
    'bg-transparent text-[var(--color-text-secondary)] border border-[var(--color-border)]',
};

const dotColors: Record<BadgeVariant, string> = {
  default:  'bg-[var(--color-text-tertiary)]',
  success:  'bg-[var(--color-success)]',
  warning:  'bg-[var(--color-warning)]',
  error:    'bg-[var(--color-error)]',
  info:     'bg-[var(--color-info)]',
  brand:    'bg-[var(--color-brand-400)]',
  outline:  'bg-[var(--color-text-tertiary)]',
};

export function Badge({
  variant = 'default',
  children,
  className = '',
  dot = false,
}: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
        variantStyles[variant],
        className,
      ].join(' ')}
    >
      {dot && (
        <span
          className={['w-1.5 h-1.5 rounded-full shrink-0', dotColors[variant]].join(' ')}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
