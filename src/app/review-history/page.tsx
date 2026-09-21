import type { Metadata } from 'next';
import { Clock } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';

export const metadata: Metadata = {
  title: 'Review History',
  description: 'View your past AI code reviews.',
};

export default function ReviewHistoryPage() {
  return (
    <div className="flex flex-col h-full">
      <Header
        title="Review History"
        subtitle="View your past AI code reviews"
        actions={<Badge variant="warning">Coming Soon</Badge>}
      />

      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="card">
            <EmptyState
              icon={<Clock size={22} />}
              title="Review History"
              description="Review history with filtering, search, and analytics will be available in a future release. Reviews are currently stored only in GitHub as PR comments."
            />
          </div>

          <div className="mt-6 card p-5 space-y-3">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
              Planned Features
            </h2>
            <ul className="space-y-2">
              {[
                'Review history database (PostgreSQL / SQLite)',
                'Per-repository review analytics',
                'Review severity tracking',
                'Export reviews as PDF/Markdown',
                'Review comparison between versions',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-disabled)] shrink-0" />
                  <span className="text-xs text-[var(--color-text-tertiary)]">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
