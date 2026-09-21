import type { ReviewResult } from '@/types';

export interface ActivePR {
  repository: string;
  source_branch: string;
  target_branch: string;
  pr_number: number;
  pr_url: string;
  head_sha?: string;
}

const STORAGE_KEY = 'ai-code-review:active-pr';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function hasString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function getActivePR(): ActivePR | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!isRecord(parsed)) {
      return null;
    }

    const repository = parsed.repository;
    const sourceBranch = parsed.source_branch;
    const targetBranch = parsed.target_branch;
    const prNumber = parsed.pr_number;
    const prUrl = parsed.pr_url;
    const headSha = parsed.head_sha;

    if (
      !hasString(repository) ||
      !hasString(sourceBranch) ||
      !hasString(targetBranch) ||
      typeof prNumber !== 'number' ||
      !Number.isFinite(prNumber) ||
      prNumber <= 0 ||
      !hasString(prUrl)
    ) {
      return null;
    }

    return {
      repository,
      source_branch: sourceBranch,
      target_branch: targetBranch,
      pr_number: prNumber,
      pr_url: prUrl,
      ...(hasString(headSha) ? { head_sha: headSha } : {}),
    };
  } catch {
    return null;
  }
}

function normalizeActivePR(result: ReviewResult | undefined | null): ActivePR | null {
  if (!result || typeof result !== 'object') {
    return null;
  }

  const record = result as unknown as Record<string, unknown>;

  if (record.review_skipped === true) {
    return null;
  }

  if (typeof record.body === 'string') {
    return null;
  }

  const repository = record.repository;
  const sourceBranch = record.source_branch;
  const targetBranch = record.target_branch;
  const prNumber = record.pr_number;
  const prUrl = record.pr_url;
  const headSha = record.head_sha;

  const hasRequiredMetadata =
    typeof repository === 'string' &&
    typeof sourceBranch === 'string' &&
    typeof targetBranch === 'string' &&
    typeof prNumber === 'number' &&
    Number.isFinite(prNumber) &&
    prNumber > 0 &&
    typeof prUrl === 'string';

  if (!hasRequiredMetadata) {
    return null;
  }

  return {
    repository,
    source_branch: sourceBranch,
    target_branch: targetBranch,
    pr_number: prNumber,
    pr_url: prUrl,
    ...(typeof headSha === 'string' && headSha.trim().length > 0 ? { head_sha: headSha } : {}),
  };
}

export function saveActivePR(result: ReviewResult | undefined | null): ActivePR | null {
  const activePR = normalizeActivePR(result);

  if (!activePR) {
    return null;
  }

  if (typeof window === 'undefined') {
    return activePR;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(activePR));
  } catch {
    // Ignore storage write failures; the app should still function without persistence.
  }

  return activePR;
}

export function clearActivePR(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage cleanup failures.
  }
}
