import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}

const config: Record<
  AlertVariant,
  { icon: React.ReactNode; classes: string }
> = {
  info: {
    icon: <Info size={16} className="shrink-0 mt-0.5" />,
    classes:
      'bg-[oklch(0.65_0.15_230/0.12)] border-[oklch(0.65_0.15_230/0.35)] text-[var(--color-info)]',
  },
  success: {
    icon: <CheckCircle2 size={16} className="shrink-0 mt-0.5" />,
    classes:
      'bg-[oklch(0.72_0.18_155/0.12)] border-[oklch(0.72_0.18_155/0.35)] text-[var(--color-success)]',
  },
  warning: {
    icon: <TriangleAlert size={16} className="shrink-0 mt-0.5" />,
    classes:
      'bg-[oklch(0.80_0.17_80/0.12)] border-[oklch(0.80_0.17_80/0.35)] text-[var(--color-warning)]',
  },
  error: {
    icon: <AlertCircle size={16} className="shrink-0 mt-0.5" />,
    classes:
      'bg-[oklch(0.65_0.22_25/0.12)] border-[oklch(0.65_0.22_25/0.35)] text-[var(--color-error)]',
  },
};

export function Alert({
  variant = 'info',
  title,
  children,
  onDismiss,
  className = '',
}: AlertProps) {
  const { icon, classes } = config[variant];

  return (
    <div
      role="alert"
      className={[
        'flex gap-3 rounded-[var(--radius-md)] border px-4 py-3 text-sm',
        classes,
        className,
      ].join(' ')}
    >
      {icon}
      <div className="flex-1 min-w-0">
        {title && <p className="font-semibold mb-0.5">{title}</p>}
        <div className="leading-relaxed opacity-90">{children}</div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss alert"
          className="shrink-0 opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
