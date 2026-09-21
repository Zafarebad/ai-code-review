'use client';

import { useEffect, useState } from 'react';
import { Select } from '@/components/ui/Select';
import type { Branch } from '@/types';
import { Spinner } from '@/components/ui/Spinner';

interface BranchSelectorProps {
  id: string;
  label: string;
  repository: string;
  value: string;
  onChange: (branch: string) => void;
  excludeBranch?: string;
  disabled?: boolean;
  error?: string;
  hint?: string;
}

export function BranchSelector({
  id,
  label,
  repository,
  value,
  onChange,
  excludeBranch,
  disabled,
  error,
  hint,
}: BranchSelectorProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [prevRepository, setPrevRepository] = useState(repository);

  if (prevRepository !== repository) {
    setPrevRepository(repository);
    setBranches([]);
    setLoading(Boolean(repository));
    setFetchError(null);
  }

  useEffect(() => {
    if (!repository) {
      return;
    }

    let cancelled = false;

    fetch(`/api/branches/${encodeURIComponent(repository)}`)
      .then((r) => r.json())
      .then((data: { branches?: Branch[]; error?: string }) => {
        if (cancelled) return;
        if (data.error) {
          setFetchError(data.error);
        } else {
          setBranches(data.branches ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) setFetchError('Failed to load branches.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [repository]);

  if (!repository) {
    return (
      <Select
        id={id}
        label={label}
        placeholder="Select a repository first"
        value=""
        onChange={() => {}}
        disabled={true}
        options={[]}
        hint="Choose a repository above to load its branches."
      />
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[var(--color-text-secondary)]">
          {label}
        </label>
        <div className="flex items-center gap-2 h-9 px-3 rounded-[var(--radius-md)] bg-[var(--color-surface-4)] border border-[var(--color-border)]">
          <Spinner size={14} label={`Loading ${label.toLowerCase()}`} />
          <span className="text-sm text-[var(--color-text-tertiary)]">
            Loading branches…
          </span>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[var(--color-text-secondary)]">
          {label}
        </label>
        <div className="h-9 px-3 flex items-center rounded-[var(--radius-md)] bg-[oklch(0.65_0.22_25/0.1)] border border-[oklch(0.65_0.22_25/0.3)]">
          <span className="text-xs text-[var(--color-error)]">{fetchError}</span>
        </div>
      </div>
    );
  }

  const options = branches
    .filter((b) => b.name !== excludeBranch)
    .map((b) => ({ value: b.name, label: b.name }));

  return (
    <Select
      id={id}
      label={label}
      placeholder={`Select ${label.toLowerCase()}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled || branches.length === 0}
      error={error}
      hint={hint}
      options={options}
    />
  );
}
