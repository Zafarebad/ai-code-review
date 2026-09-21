'use client';

import { useEffect, useState } from 'react';
import {
  Search,
  GitPullRequest,
  FileDiff,
  Bot,
  MessageSquare,
  Send,
  CheckCircle2,
} from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';

interface WorkflowStep {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const STEPS: WorkflowStep[] = [
  { id: 'check-repo',    label: 'Checking repository…',               icon: <Search size={14} /> },
  { id: 'check-pr',     label: 'Checking existing Pull Request…',     icon: <GitPullRequest size={14} /> },
  { id: 'pr-action',    label: 'Creating / locating Pull Request…',   icon: <GitPullRequest size={14} /> },
  { id: 'get-diff',     label: 'Fetching changed files…',             icon: <FileDiff size={14} /> },
  { id: 'ai-review',    label: 'Running AI Code Review…',             icon: <Bot size={14} /> },
  { id: 'post-comment', label: 'Posting review to GitHub…',           icon: <MessageSquare size={14} /> },
  { id: 'notify',       label: 'Sending Telegram notification…',      icon: <Send size={14} /> },
  { id: 'done',         label: 'Completed',                           icon: <CheckCircle2 size={14} /> },
];

// Advance one step approximately every 2 seconds during loading.
// This is a UX representation — real step completion is determined by the n8n response.
const STEP_INTERVAL_MS = 2000;

interface WorkflowProgressProps {
  isLoading: boolean;
}

export function WorkflowProgress({ isLoading }: WorkflowProgressProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [prevLoading, setPrevLoading] = useState(isLoading);

  if (prevLoading !== isLoading) {
    setPrevLoading(isLoading);
    if (isLoading) {
      setActiveStep(0);
    }
  }

  useEffect(() => {
    if (!isLoading) {
      return;
    }

    const interval = setInterval(() => {
      setActiveStep((prev) => {
        // Stop advancing at the second-to-last step
        if (prev < STEPS.length - 2) return prev + 1;
        return prev;
      });
    }, STEP_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <div className="animate-fade-in-up mt-6 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-2)] overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--color-border)] flex items-center gap-2">
        <Spinner size={14} label="Processing" />
        <span className="text-sm font-medium text-[var(--color-text-secondary)]">
          Processing your request…
        </span>
      </div>

      <div className="p-4">
        <p className="text-xs text-[var(--color-text-tertiary)] mb-3">
          This may take up to 2 minutes while n8n runs the workflow.
        </p>
        <ol className="space-y-2" aria-label="Workflow progress">
          {STEPS.map((step, index) => {
            const isPast   = index < activeStep;
            const isActive = index === activeStep;
            const isFuture = index > activeStep;

            return (
              <li key={step.id} className="flex items-center gap-3">
                {/* Status indicator */}
                <div
                  aria-hidden="true"
                  className={[
                    'flex items-center justify-center w-5 h-5 rounded-full shrink-0 transition-all duration-300',
                    isPast
                      ? 'bg-[var(--color-success)] text-white'
                      : isActive
                      ? 'bg-[var(--color-brand-600)] text-white'
                      : 'bg-[var(--color-surface-4)] border border-[var(--color-border)] text-[var(--color-text-disabled)]',
                  ].join(' ')}
                >
                  {isPast ? (
                    <CheckCircle2 size={12} />
                  ) : isActive ? (
                    <span className="animate-pulse-dot">{step.icon}</span>
                  ) : (
                    step.icon
                  )}
                </div>

                {/* Label */}
                <span
                  className={[
                    'text-sm transition-colors duration-300',
                    isPast
                      ? 'text-[var(--color-text-secondary)] line-through decoration-[var(--color-text-disabled)]'
                      : isActive
                      ? 'text-[var(--color-text-primary)] font-medium'
                      : isFuture
                      ? 'text-[var(--color-text-disabled)]'
                      : '',
                  ].join(' ')}
                >
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
