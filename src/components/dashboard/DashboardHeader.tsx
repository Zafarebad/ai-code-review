import { Zap } from 'lucide-react';

export function DashboardHeader() {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2.5 mb-2">
        <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--color-brand-600)] flex items-center justify-center">
          <Zap size={16} className="text-white" fill="white" />
        </div>
        <h1 className="text-xl font-bold text-[var(--color-text-primary)] tracking-tight">
          AI Code Review
        </h1>
      </div>
      <p className="text-sm text-[var(--color-text-secondary)] ml-10.5">
        Automatically create Pull Requests and review code with AI.
      </p>
    </div>
  );
}
