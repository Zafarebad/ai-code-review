interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={[
        'flex flex-col items-center justify-center gap-4 py-16 px-6 text-center',
        className,
      ].join(' ')}
    >
      {icon && (
        <div className="w-12 h-12 rounded-xl bg-[var(--color-surface-4)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-tertiary)]">
          {icon}
        </div>
      )}
      <div className="space-y-1 max-w-xs">
        <p className="font-semibold text-[var(--color-text-primary)]">{title}</p>
        {description && (
          <p className="text-sm text-[var(--color-text-tertiary)] leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
