'use client';

import {
  CheckCircle2,
  ExternalLink,
  GitPullRequest,
  Bot,
  MessageSquare,
  Send,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { PRResult, ReviewResult } from '@/types';

interface PRResultCardProps {
  result: ReviewResult;
  onReset: () => void;
}

export function PRResultCard({ result, onReset }: PRResultCardProps) {
  const isSkippedReview =
    'review_skipped' in result && result.review_skipped === true;
  const isMarkdownReview =
    'body' in result && typeof result.body === 'string';

  if (isSkippedReview) {
    return (
      <div className="animate-fade-in-up mt-6 rounded-[var(--radius-lg)] border border-[var(--color-border)] overflow-hidden bg-[var(--color-surface-2)]">
        <div className="px-5 py-4 border-b border-[var(--color-border)] bg-[oklch(0.72_0.18_155/0.08)]">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 w-8 h-8 rounded-full bg-[oklch(0.72_0.18_155/0.2)] flex items-center justify-center shrink-0">
              <Info size={18} className="text-[var(--color-warning)]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Review Skipped
              </h2>
              <p className="text-xs text-[var(--color-text-tertiary)] mt-1 leading-relaxed">
                {result.reason}
              </p>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 space-y-3">
          <DetailRow label="Repository" value={result.repository ?? '—'} />
          {typeof result.pr_number === 'number' && (
            <DetailRow label="PR Number" value={`#${result.pr_number}`} />
          )}
          {result.head_sha && (
            <DetailRow
              label="Head SHA"
              value={
                <span className="font-mono text-[11px] bg-[var(--color-surface-4)] px-1.5 py-0.5 rounded text-[var(--color-text-secondary)]">
                  {result.head_sha}
                </span>
              }
            />
          )}
        </div>

        <div className="px-5 py-4 border-t border-[var(--color-border)] flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onReset}>
            New Review
          </Button>
        </div>
      </div>
    );
  }

  if (isMarkdownReview) {
    const repoName =
      result.repository?.split('/').pop() ?? result.repository ?? 'Repository';

    return (
      <div className="animate-fade-in-up mt-6 rounded-[var(--radius-lg)] border border-[var(--color-border)] overflow-hidden bg-[var(--color-surface-2)]">
        <div className="px-5 py-4 border-b border-[var(--color-border)] bg-[oklch(0.72_0.18_155/0.08)]">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 w-8 h-8 rounded-full bg-[oklch(0.72_0.18_155/0.2)] flex items-center justify-center shrink-0">
              <Bot size={18} className="text-[var(--color-brand-400)]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                AI Review Complete
              </h2>
              <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                Review generated from the selected branch comparison.
              </p>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 space-y-3">
          <DetailRow label="Repository" value={repoName} />
          <DetailRow
            label="Source"
            value={
              <span className="font-mono text-xs bg-[var(--color-surface-4)] px-1.5 py-0.5 rounded text-[var(--color-brand-300)]">
                {result.source_branch ?? '—'}
              </span>
            }
          />
          <DetailRow
            label="Target"
            value={
              <span className="font-mono text-xs bg-[var(--color-surface-4)] px-1.5 py-0.5 rounded text-[var(--color-text-secondary)]">
                {result.target_branch ?? '—'}
              </span>
            }
          />

          <div className="border-t border-[var(--color-border)] pt-3 space-y-2">
            <div className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-tertiary)]">
              AI Review
            </div>
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-3)] p-3 text-sm leading-6 text-[var(--color-text-primary)] whitespace-pre-wrap break-words">
              {result.body}
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-[var(--color-border)] flex flex-wrap items-center gap-3">
          {result.html_url ? (
            <a
              href={result.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 h-8 px-3 text-xs font-medium rounded-[var(--radius-md)] bg-[var(--color-brand-600)] text-white hover:bg-[var(--color-brand-500)] transition-all duration-150"
            >
              Open GitHub Comment
              <ExternalLink size={13} />
            </a>
          ) : null}
          <Button variant="ghost" size="sm" onClick={onReset}>
            New Review
          </Button>
        </div>
      </div>
    );
  }

  const legacyResult = result as PRResult;
  const {
    pr_exists,
    pr_created,
    pr_number,
    repository,
    source_branch,
    target_branch,
    review_completed,
    comment_posted,
    telegram_sent,
    pr_url,
  } = legacyResult;

  const repoName = repository.split('/').pop() ?? repository;

  return (
    <div className="animate-fade-in-up mt-6 rounded-[var(--radius-lg)] border border-[var(--color-border)] overflow-hidden bg-[var(--color-surface-2)]">
      <div className="px-5 py-4 border-b border-[var(--color-border)] bg-[oklch(0.72_0.18_155/0.08)]">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 w-8 h-8 rounded-full bg-[oklch(0.72_0.18_155/0.2)] flex items-center justify-center shrink-0">
            <CheckCircle2 size={18} className="text-[var(--color-success)]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
              {pr_exists
                ? `Existing Pull Request Found #${pr_number}`
                : `Pull Request Created #${pr_number}`}
            </h2>
            {pr_exists && (
              <p className="text-xs text-[var(--color-text-tertiary)] mt-1 leading-relaxed">
                No new Pull Request was created — the existing PR #{pr_number} was used.
              </p>
            )}
            {pr_created && (
              <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                A new Pull Request was created and reviewed successfully.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="px-5 py-4 space-y-3">
        <DetailRow label="Repository" value={repoName} />
        <DetailRow
          label="Source"
          value={
            <span className="font-mono text-xs bg-[var(--color-surface-4)] px-1.5 py-0.5 rounded text-[var(--color-brand-300)]">
              {source_branch}
            </span>
          }
        />
        <DetailRow
          label="Target"
          value={
            <span className="font-mono text-xs bg-[var(--color-surface-4)] px-1.5 py-0.5 rounded text-[var(--color-text-secondary)]">
              {target_branch}
            </span>
          }
        />

        <div className="border-t border-[var(--color-border)] pt-3 space-y-2">
          <StatusRow
            icon={<Bot size={13} />}
            label="AI Review"
            status={review_completed ? 'success' : 'skipped'}
            successText="Completed"
            skippedText="Skipped"
          />
          <StatusRow
            icon={<MessageSquare size={13} />}
            label="GitHub"
            status={comment_posted ? 'success' : 'skipped'}
            successText="Review Posted"
            skippedText="Not Posted"
          />
          <StatusRow
            icon={<Send size={13} />}
            label="Telegram"
            status={telegram_sent ? 'success' : 'skipped'}
            successText="Notification Sent"
            skippedText="Skipped"
          />
          <StatusRow
            icon={<GitPullRequest size={13} />}
            label="PR Status"
            status="info"
            infoText={pr_exists ? 'Existing PR' : 'Newly Created'}
          />
        </div>
      </div>

      <div className="px-5 py-4 border-t border-[var(--color-border)] flex flex-wrap items-center gap-3">
        <a
          href={pr_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 h-8 px-3 text-xs font-medium rounded-[var(--radius-md)] bg-[var(--color-brand-600)] text-white hover:bg-[var(--color-brand-500)] transition-all duration-150"
        >
          Open Pull Request
          <ExternalLink size={13} />
        </a>
        <Button variant="ghost" size="sm" onClick={onReset}>
          New Review
        </Button>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-[var(--color-text-tertiary)] shrink-0">{label}</span>
      <span className="text-xs text-[var(--color-text-primary)] text-right">{value}</span>
    </div>
  );
}

type StatusType = 'success' | 'skipped' | 'error' | 'info';

function StatusRow({
  icon,
  label,
  status,
  successText,
  skippedText,
  infoText,
}: {
  icon: React.ReactNode;
  label: string;
  status: StatusType;
  successText?: string;
  skippedText?: string;
  infoText?: string;
}) {
  let badge: React.ReactNode;
  switch (status) {
    case 'success':
      badge = <Badge variant="success">✓ {successText}</Badge>;
      break;
    case 'skipped':
      badge = <Badge variant="default">{skippedText}</Badge>;
      break;
    case 'error':
      badge = <Badge variant="error">Failed</Badge>;
      break;
    case 'info':
      badge = <Badge variant="info"><Info size={10} className="inline" /> {infoText}</Badge>;
      break;
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
        <span className="text-[var(--color-text-tertiary)]">{icon}</span>
        <span className="text-xs">{label}</span>
      </div>
      {badge}
    </div>
  );
}
