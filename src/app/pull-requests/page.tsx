'use client';

import type { Metadata } from 'next';
import { ExternalLink, GitPullRequest, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { EmptyState } from '@/components/ui/EmptyState';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { RepositorySelector } from '@/components/dashboard/RepositorySelector';
import type { PullRequestSummary } from '@/types';

export const metadata: Metadata = {
  title: 'Pull Requests',
  description: 'View and manage your Pull Requests.',
};

export default function PullRequestsPage() {
  const [selectedRepository, setSelectedRepository] = useState('');
  const [pullRequests, setPullRequests] = useState<PullRequestSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedRepository) {
      setPullRequests([]);
      setError(null);
      return;
    }

    let cancelled = false;

    setIsLoading(true);
    setError(null);

    fetch(`/api/pull-requests?repository=${encodeURIComponent(selectedRepository)}`)
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            typeof data?.error === 'string'
              ? data.error
              : 'Unable to load pull requests.'
          );
        }

        return Array.isArray(data?.pullRequests) ? data.pullRequests : [];
      })
      .then((items) => {
        if (!cancelled) {
          setPullRequests(items);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setPullRequests([]);
          setError(
            err instanceof Error && err.message
              ? err.message
              : 'Unable to load pull requests.'
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedRepository]);

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Pull Requests"
        subtitle="View and manage your Pull Requests"
        actions={<Badge variant="info">Open PRs</Badge>}
      />

      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="card p-6">
            <RepositorySelector
              value={selectedRepository}
              onChange={setSelectedRepository}
              disabled={false}
            />
          </div>

          {isLoading && (
            <div className="card p-4">
              <div className="flex items-center gap-3 text-sm text-[var(--color-text-secondary)]">
                <Loader2 size={16} className="animate-spin" />
                Loading open pull requests…
              </div>
            </div>
          )}

          {!selectedRepository && !isLoading && (
            <div className="card">
              <EmptyState
                icon={<GitPullRequest size={22} />}
                title="Select a repository"
                description="Choose a GitHub repository to view its currently open pull requests."
              />
            </div>
          )}

          {selectedRepository && !isLoading && error && (
            <Alert variant="error" title="Unable to load pull requests">
              {error}
            </Alert>
          )}

          {selectedRepository && !isLoading && !error && pullRequests.length === 0 && (
            <div className="card">
              <EmptyState
                icon={<GitPullRequest size={22} />}
                title="No open pull requests"
                description={`There are no open pull requests in ${selectedRepository} right now.`}
              />
            </div>
          )}

          {selectedRepository && !isLoading && !error && pullRequests.length > 0 && (
            <div className="space-y-4">
              {pullRequests.map((pr) => (
                <div key={pr.number} className="card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium text-[var(--color-text-tertiary)]">
                          #{pr.number}
                        </span>
                        <Badge variant="info">{pr.state}</Badge>
                      </div>
                      <h3 className="mt-2 text-sm font-semibold text-[var(--color-text-primary)] break-words">
                        {pr.title}
                      </h3>
                    </div>

                    <a
                      href={pr.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-brand-300)] hover:text-[var(--color-brand-200)]"
                    >
                      Open PR
                      <ExternalLink size={12} />
                    </a>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-2 text-xs text-[var(--color-text-tertiary)] sm:grid-cols-2">
                    <div>
                      <span className="font-medium text-[var(--color-text-secondary)]">Repository:</span>{' '}
                      {pr.repository}
                    </div>
                    <div>
                      <span className="font-medium text-[var(--color-text-secondary)]">Author:</span>{' '}
                      {pr.author_login ?? 'Unknown'}
                    </div>
                    <div>
                      <span className="font-medium text-[var(--color-text-secondary)]">Source:</span>{' '}
                      {pr.source_branch || '—'}
                    </div>
                    <div>
                      <span className="font-medium text-[var(--color-text-secondary)]">Target:</span>{' '}
                      {pr.target_branch || '—'}
                    </div>
                    <div>
                      <span className="font-medium text-[var(--color-text-secondary)]">Created:</span>{' '}
                      {pr.created_at ? new Date(pr.created_at).toLocaleDateString() : '—'}
                    </div>
                    <div>
                      <span className="font-medium text-[var(--color-text-secondary)]">Updated:</span>{' '}
                      {pr.updated_at ? new Date(pr.updated_at).toLocaleDateString() : '—'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
