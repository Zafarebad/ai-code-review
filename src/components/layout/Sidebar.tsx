'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookMarked,
  GitPullRequest,
  Clock,
  Settings,
  Zap,
  X,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard size={17} />,
  },
  {
    href: '/repositories',
    label: 'Repositories',
    icon: <BookMarked size={17} />,
  },
  {
    href: '/pull-requests',
    label: 'Pull Requests',
    icon: <GitPullRequest size={17} />,
  },
  {
    href: '/review-history',
    label: 'Review History',
    icon: <Clock size={17} />,
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: <Settings size={17} />,
  },
];

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col h-full w-60 bg-[var(--color-surface-1)]/95 backdrop-blur-xl border-r border-[var(--color-border)] shrink-0 select-none overflow-hidden">
      {/* Brand */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-[var(--color-border)] shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2.5 group" onClick={onClose}>
          <div className="w-7 h-7 rounded-[var(--radius-sm)] bg-[var(--color-brand-600)] flex items-center justify-center shadow-sm group-hover:bg-[var(--color-brand-500)] transition-colors">
            <Zap size={15} className="text-white" fill="white" />
          </div>
          <span className="font-semibold text-sm tracking-tight text-[var(--color-text-primary)]">
            AI Code Review
          </span>
        </Link>
        {/* Mobile close */}
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="lg:hidden text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto min-h-0" aria-label="Main navigation">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  aria-current={isActive ? 'page' : undefined}
                  className={[
                    'flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)]',
                    'text-sm font-medium transition-all duration-150 group',
                    isActive
                      ? 'bg-[var(--color-brand-900)] text-[var(--color-brand-300)]'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-3)] hover:text-[var(--color-text-primary)]',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'transition-colors',
                      isActive
                        ? 'text-[var(--color-brand-400)]'
                        : 'text-[var(--color-text-tertiary)] group-hover:text-[var(--color-text-secondary)]',
                    ].join(' ')}
                  >
                    {item.icon}
                  </span>
                  {item.label}
                  {item.badge && (
                    <span className="ml-auto text-xs bg-[var(--color-brand-600)] text-white px-1.5 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-[var(--color-border)] shrink-0 bg-[var(--color-surface-1)]/90">
        <div className="px-3 py-2 rounded-[var(--radius-md)] bg-[var(--color-surface-2)]/90 border border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <p className="text-xs font-medium text-[var(--color-text-secondary)]">Powered by n8n</p>
          </div>
          <p className="text-[11px] text-[var(--color-text-tertiary)] mt-1">
            Automation + Claude AI
          </p>
        </div>
      </div>
    </aside>
  );
}
