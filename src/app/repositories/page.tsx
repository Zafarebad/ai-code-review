import type { Metadata } from 'next';
import { BookMarked } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';

export const metadata: Metadata = {
  title: 'Repositories',
  description: 'Manage your connected GitHub repositories.',
};

export default function RepositoriesPage() {
  return (
    <div className="flex flex-col h-full">
      <Header
        title="Repositories"
        subtitle="Manage your connected GitHub repositories"
        actions={<Badge variant="warning">Coming Soon</Badge>}
      />

      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="card">
            <EmptyState
              icon={<BookMarked size={22} />}
              title="Repository Management"
              description="Full repository management with GitHub OAuth and organization support is planned for a future release. For now, repositories are configured via the mock data in src/config/mock-data.ts."
            />
          </div>

          <div className="mt-6 card p-5 space-y-3">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
              Currently Configured Repositories
            </h2>
            <p className="text-xs text-[var(--color-text-tertiary)]">
              These repositories are available in the Dashboard. Edit{' '}
              <code className="px-1 py-0.5 bg-[var(--color-surface-4)] rounded text-[var(--color-brand-300)] font-mono text-xs">
                src/config/mock-data.ts
              </code>{' '}
              to add more.
            </p>
            <div className="divide-y divide-[var(--color-border)]">
              {[
                { name: 'test-ai-review', owner: 'Zafarebad', visibility: 'Public' },
                { name: 'ai-code-review', owner: 'Zafarebad', visibility: 'Public' },
              ].map((repo) => (
                <div key={repo.name} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">
                      {repo.owner}/{repo.name}
                    </p>
                    <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                      Mock data — replace with GitHub API
                    </p>
                  </div>
                  <Badge variant="outline">{repo.visibility}</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
