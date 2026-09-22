import { Zap } from 'lucide-react';

interface DashboardHeaderProps {
  isGitHubConnected?: boolean;
}

export function DashboardHeader({ isGitHubConnected = false }: DashboardHeaderProps) {
  return (
    <div className="mb-8 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--color-brand-600)] flex items-center justify-center">
            <Zap size={16} className="text-white" fill="white" />
          </div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)] tracking-tight">
            AI Code Review
          </h1>
        </div>

        {!isGitHubConnected && (
          <a
            href="/api/auth/github/login"
            className="inline-flex items-center justify-center h-9 px-4 text-sm font-medium rounded-[var(--radius-md)] bg-[var(--color-brand-600)] text-white hover:bg-[var(--color-brand-500)] active:bg-[var(--color-brand-700)] transition-colors"
          >
            Connect GitHub
          </a>
        )}
      </div>

      <p className="text-sm text-[var(--color-text-secondary)] ml-10.5">
        Automatically create Pull Requests and review code with AI.
      </p>
    </div>
  );
}
