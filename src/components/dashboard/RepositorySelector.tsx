'use client';

import { useEffect, useState } from 'react';
import { Select } from '@/components/ui/Select';
import type { Repository } from '@/types';
import { Spinner } from '@/components/ui/Spinner';

interface RepositorySelectorProps {
  value: string;
  onChange: (repoFullName: string) => void;
  disabled?: boolean;
  error?: string;
}

export function RepositorySelector({
  value,
  onChange,
  disabled,
  error,
}: RepositorySelectorProps) {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/repositories')
      .then((r) => r.json())
      .then((data: { repositories?: Repository[]; error?: string }) => {
        if (cancelled) return;
        if (data.error) {
          setFetchError(data.error);
        } else {
          setRepos(data.repositories ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) setFetchError('Failed to load repositories.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[var(--color-text-secondary)]">
          Repository
        </label>
        <div className="flex items-center gap-2 h-9 px-3 rounded-[var(--radius-md)] bg-[var(--color-surface-4)] border border-[var(--color-border)]">
          <Spinner size={14} label="Loading repositories" />
          <span className="text-sm text-[var(--color-text-tertiary)]">
            Loading repositories…
          </span>
        </div>
      </div>
    );
  }

  if (fetchError) {
    const isGitHubAuthError = fetchError.toLowerCase().includes('authorize github access') ||
      fetchError.toLowerCase().includes('github authentication');

    return (
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[var(--color-text-secondary)]">
          Repository
        </label>
        <div className="flex flex-col gap-2 rounded-[var(--radius-md)] bg-[oklch(0.65_0.22_25/0.1)] border border-[oklch(0.65_0.22_25/0.3)] p-3">
          <span className="text-xs text-[var(--color-error)]">{fetchError}</span>
          {isGitHubAuthError && (
            <a
              href="/api/auth/github/login"
              className="inline-flex items-center justify-center h-9 px-4 text-sm font-medium rounded-[var(--radius-md)] bg-[var(--color-brand-600)] text-white hover:bg-[var(--color-brand-500)] active:bg-[var(--color-brand-700)] transition-colors w-fit"
            >
              Connect GitHub
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <Select
      id="repository"
      label="Repository"
      placeholder="Select a repository"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      error={error}
      options={repos.map((r) => ({
        value: r.fullName,
        label: r.fullName,
      }))}
    />
  );
}
