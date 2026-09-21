import { forwardRef } from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
  noPadding?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ elevated = false, noPadding = false, children, className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={[
          elevated ? 'card-elevated' : 'card',
          noPadding ? '' : 'p-5',
          className,
        ].join(' ')}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// ── Card subcomponents ────────────────────────────────────────────────────────

export function CardHeader({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        'px-5 py-4 border-b border-[var(--color-border)]',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3 className={['text-sm font-semibold text-[var(--color-text-primary)]', className].join(' ')}>
      {children}
    </h3>
  );
}

export function CardDescription({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={['text-xs text-[var(--color-text-secondary)] mt-0.5', className].join(' ')}>
      {children}
    </p>
  );
}

export function CardContent({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={['px-5 py-5', className].join(' ')}>{children}</div>;
}

export function CardFooter({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        'px-5 py-4 border-t border-[var(--color-border)] bg-[var(--color-surface-1)] ' +
          'rounded-b-[var(--radius-lg)]',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}
