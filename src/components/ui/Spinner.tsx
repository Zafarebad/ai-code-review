import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  size?: number;
  className?: string;
  label?: string;
}

export function Spinner({ size = 20, className = '', label = 'Loading…' }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={['inline-flex items-center justify-center', className].join(' ')}
    >
      <Loader2
        size={size}
        className="animate-spin text-[var(--color-brand-400)]"
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function FullPageSpinner() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 min-h-64">
      <Spinner size={32} />
      <p className="text-sm text-[var(--color-text-tertiary)]">Loading…</p>
    </div>
  );
}
