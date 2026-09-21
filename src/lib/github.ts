/**
 * GitHub Service — server-side only
 *
 * Uses the GitHub REST API to fetch repositories and branches for the authenticated
 * user. The token is read from process.env.GITHUB_TOKEN and never exposed to the
 * browser or client-side code.
 */

import type { Repository, Branch, PullRequestSummary } from '@/types';

const GITHUB_API_BASE = 'https://api.github.com';

export class GitHubApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'GitHubApiError';
    this.status = status;
    this.code = code;
  }
}

function getGitHubToken(): string {
  const token = process.env.GITHUB_TOKEN;

  if (!token || !token.trim()) {
    throw new Error('GITHUB_TOKEN is not configured on the server.');
  }

  return token.trim();
}

function getGitHubHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${getGitHubToken()}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'ai-code-review-app',
  };
}

function normalizeRepository(repo: Record<string, unknown>): Repository {
  const repoName = typeof repo.name === 'string' ? repo.name : '';
  const owner = repo.owner && typeof repo.owner === 'object'
    ? (repo.owner as Record<string, unknown>).login
    : '';

  return {
    id: String(repo.id ?? repoName),
    fullName: `${owner}/${repoName}`,
    name: repoName,
    owner: typeof owner === 'string' ? owner : '',
    description:
      typeof repo.description === 'string' ? repo.description : undefined,
    private: Boolean(repo.private),
    url:
      typeof repo.html_url === 'string'
        ? repo.html_url
        : `https://github.com/${owner}/${repoName}`,
    defaultBranch:
      typeof repo.default_branch === 'string' ? repo.default_branch : 'main',
  };
}

function normalizeBranch(branch: Record<string, unknown>): Branch {
  const commit = branch.commit;
  const commitSha =
    commit && typeof commit === 'object'
      ? (commit as Record<string, unknown>).sha
      : undefined;

  return {
    name: typeof branch.name === 'string' ? branch.name : '',
    sha: typeof commitSha === 'string' ? commitSha : '',
    protected: Boolean(branch.protected),
  };
}

function githubErrorMessage(status: number): string {
  switch (status) {
    case 401:
      return 'GitHub authentication failed. Please check the configured GitHub access token.';
    case 403:
      return 'GitHub denied this request due to insufficient permissions.';
    case 404:
      return 'GitHub repository or resource was not found.';
    case 429:
      return 'GitHub rate limit reached. Please wait a moment and try again.';
    default:
      if (status >= 500) {
        return 'GitHub is temporarily unavailable. Please try again later.';
      }
      return 'GitHub request failed. Please try again later.';
  }
}

export function normalizeGitHubError(error: unknown): GitHubApiError {
  if (error instanceof GitHubApiError) {
    return error;
  }

  if (error instanceof Error) {
    return new GitHubApiError(503, 'NETWORK_ERROR', error.message || 'GitHub request failed. Please try again later.');
  }

  return new GitHubApiError(503, 'NETWORK_ERROR', 'GitHub request failed. Please try again later.');
}

function normalizeGitHubStatusError(
  status: number,
  detail?: string
): GitHubApiError {
  const message = detail && detail.trim()
    ? githubErrorMessage(status)
    : githubErrorMessage(status);

  switch (status) {
    case 401:
      return new GitHubApiError(status, 'UNAUTHORIZED', message);
    case 403:
      return new GitHubApiError(status, 'FORBIDDEN', message);
    case 404:
      return new GitHubApiError(status, 'NOT_FOUND', message);
    case 429:
      return new GitHubApiError(status, 'RATE_LIMITED', message);
    default:
      if (status >= 500) {
        return new GitHubApiError(status, 'SERVER_ERROR', message);
      }
      return new GitHubApiError(status, 'GITHUB_ERROR', message);
  }
}

function parseGitHubErrorBody(raw: string): string {
  if (!raw || !raw.trim()) {
    return 'GitHub request failed.';
  }

  try {
    const parsed = JSON.parse(raw) as { message?: string };
    if (typeof parsed.message === 'string' && parsed.message.trim()) {
      return parsed.message.trim();
    }
  } catch {
    // Ignore JSON parse issues; fall back to raw text.
  }

  return raw.trim();
}

async function githubFetch<T>(url: string): Promise<T> {
  try {
    const response = await fetch(url, {
      headers: getGitHubHeaders(),
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      const detail = parseGitHubErrorBody(errorText);
      throw normalizeGitHubStatusError(response.status, detail);
    }

    return (await response.json()) as T;
  } catch (error: unknown) {
    if (error instanceof GitHubApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new GitHubApiError(504, 'TIMEOUT', 'GitHub request timed out. Please try again later.');
    }

    const message = error instanceof Error ? error.message : 'GitHub request failed.';
    throw new GitHubApiError(503, 'NETWORK_ERROR', message || 'GitHub request failed. Please try again later.');
  }
}

// ──────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────

/**
 * Return all repositories available to the authenticated user.
 */
export async function getRepositories(): Promise<Repository[]> {
  const repos = await githubFetch<Array<Record<string, unknown>>>(
    `${GITHUB_API_BASE}/user/repos?per_page=100&sort=updated`
  );

  return repos
    .filter((repo) => repo && typeof repo === 'object')
    .map((repo) => normalizeRepository(repo));
}

/**
 * Return a single repository by full name.
 */
export async function getRepository(
  fullName: string
): Promise<Repository | null> {
  const [owner, repoName] = fullName.split('/');

  if (!owner || !repoName) {
    return null;
  }

  try {
    const repo = await githubFetch<Record<string, unknown>>(
      `${GITHUB_API_BASE}/repos/${owner}/${repoName}`
    );

    return normalizeRepository(repo);
  } catch (error: unknown) {
    const gitHubError = error instanceof GitHubApiError ? error : new GitHubApiError(503, 'NETWORK_ERROR', 'GitHub request failed.');

    if (gitHubError.status === 404) {
      return null;
    }

    throw gitHubError;
  }
}

/**
 * Return all branches for a repository.
 */
export async function getBranches(repoFullName: string): Promise<Branch[]> {
  const [owner, repoName] = repoFullName.split('/');

  if (!owner || !repoName) {
    return [];
  }

  const branches = await githubFetch<Array<Record<string, unknown>>>(
    `${GITHUB_API_BASE}/repos/${owner}/${repoName}/branches`
  );

  return branches
    .filter((branch) => branch && typeof branch === 'object')
    .map((branch) => normalizeBranch(branch));
}

export async function getOpenPullRequests(
  repoFullName: string
): Promise<PullRequestSummary[]> {
  const [owner, repoName] = repoFullName.split('/');

  if (!owner || !repoName) {
    return [];
  }

  const pulls = await githubFetch<Array<Record<string, unknown>>>(
    `${GITHUB_API_BASE}/repos/${owner}/${repoName}/pulls?state=open&per_page=100`
  );

  return pulls
    .filter((pull) => pull && typeof pull === 'object')
    .map((pull) => {
      const pr = pull as Record<string, unknown>;
      const number = Number(pr.number ?? 0);
      const title = typeof pr.title === 'string' ? pr.title : 'Untitled pull request';
      const state = typeof pr.state === 'string' ? pr.state : 'open';
      const htmlUrl = typeof pr.html_url === 'string'
        ? pr.html_url
        : `https://github.com/${repoFullName}/pull/${number}`;
      const createdAt = typeof pr.created_at === 'string' ? pr.created_at : '';
      const updatedAt = typeof pr.updated_at === 'string' ? pr.updated_at : '';
      const user = pr.user && typeof pr.user === 'object'
        ? (pr.user as Record<string, unknown>)
        : {};
      const authorLogin = typeof user.login === 'string' ? user.login : null;
      const head = pr.head && typeof pr.head === 'object'
        ? (pr.head as Record<string, unknown>)
        : {};
      const base = pr.base && typeof pr.base === 'object'
        ? (pr.base as Record<string, unknown>)
        : {};
      const sourceBranch = typeof head.ref === 'string' ? head.ref : '';
      const targetBranch = typeof base.ref === 'string' ? base.ref : '';

      return {
        number,
        title,
        repository: repoFullName,
        source_branch: sourceBranch,
        target_branch: targetBranch,
        state,
        html_url: htmlUrl,
        created_at: createdAt,
        updated_at: updatedAt,
        author_login: authorLogin,
      };
    });
}

/**
 * Validate that a branch exists in a repository.
 */
export async function branchExists(
  repoFullName: string,
  branchName: string
): Promise<boolean> {
  const branches = await getBranches(repoFullName);
  return branches.some((b) => b.name === branchName);
}

/**
 * Return an existing open PR for the same repository + source branch + target branch.
 * This prevents duplicate PR creation when the user retries the same branch pairing.
 */
export async function findOpenPullRequest(
  repoFullName: string,
  sourceBranch: string,
  targetBranch: string
): Promise<{
  number: number;
  url: string;
  repository: string;
  source_branch: string;
  target_branch: string;
} | null> {
  const [owner, repoName] = repoFullName.split('/');

  if (!owner || !repoName) {
    return null;
  }

  try {
    const pulls = await githubFetch<Array<Record<string, unknown>>>(
      `${GITHUB_API_BASE}/repos/${owner}/${repoName}/pulls?state=open&head=${owner}:${sourceBranch}&base=${targetBranch}`
    );

    const pr = pulls.find((item) => {
      if (!item || typeof item !== 'object') {
        return false;
      }

      const itemRecord = item as Record<string, unknown>;
      const state = typeof itemRecord.state === 'string' ? itemRecord.state : undefined;
      const head = itemRecord.head && typeof itemRecord.head === 'object'
        ? (itemRecord.head as Record<string, unknown>)
        : {};
      const base = itemRecord.base && typeof itemRecord.base === 'object'
        ? (itemRecord.base as Record<string, unknown>)
        : {};

      const headRepo = head.repo && typeof head.repo === 'object'
        ? (head.repo as Record<string, unknown>)
        : {};
      const baseRepo = base.repo && typeof base.repo === 'object'
        ? (base.repo as Record<string, unknown>)
        : {};

      const headRepoName = typeof headRepo.full_name === 'string' ? headRepo.full_name : '';
      const baseRepoName = typeof baseRepo.full_name === 'string' ? baseRepo.full_name : '';
      const headRef = typeof head.ref === 'string' ? head.ref : '';
      const baseRef = typeof base.ref === 'string' ? base.ref : '';

      return (
        state === 'open' &&
        headRepoName.toLowerCase() === repoFullName.toLowerCase() &&
        baseRepoName.toLowerCase() === repoFullName.toLowerCase() &&
        headRef === sourceBranch &&
        baseRef === targetBranch
      );
    });

    if (!pr || typeof pr !== 'object') {
      return null;
    }

    const prRecord = pr as Record<string, unknown>;
    const number = Number(prRecord.number ?? 0);
    const htmlUrl = typeof prRecord.html_url === 'string'
      ? prRecord.html_url
      : `https://github.com/${repoFullName}/pull/${number}`;

    if (!number) {
      return null;
    }

    return {
      number,
      url: htmlUrl,
      repository: repoFullName,
      source_branch: sourceBranch,
      target_branch: targetBranch,
    };
  } catch (error: unknown) {
    const gitHubError = error instanceof GitHubApiError ? error : new GitHubApiError(503, 'NETWORK_ERROR', 'GitHub request failed.');

    if (gitHubError.status === 404) {
      return null;
    }

    throw gitHubError;
  }
}
