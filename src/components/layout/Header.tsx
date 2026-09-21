'use client';

import { Menu } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  onMenuClick?: () => void;
}

export function Header({ title, subtitle, actions, onMenuClick }: HeaderProps) {
  return (
    <header className="flex items-center gap-4 h-16 px-6 border-b border-[var(--color-border)] bg-[var(--color-surface-1)]/80 backdrop-blur-md sticky top-0 z-20 shrink-0">
      {/* Mobile hamburger */}
      {onMenuClick && (
        <button
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          className="lg:hidden text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <Menu size={20} />
        </button>
      )}

      <div className="flex-1 min-w-0">
        <h1 className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-[var(--color-text-tertiary)] truncate">{subtitle}</p>
        )}
      </div>

      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </header>
  );
}
