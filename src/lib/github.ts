/**
 * GitHub Service — server-side only
 *
 * Uses the GitHub REST API to fetch repositories and branches for the authenticated
 * user. Access tokens are read from the logged-in session cookie when available,
 * otherwise the existing server-side GITHUB_TOKEN fallback is used. Tokens are never
 * exposed to browser or client-side code.
 */

import { cookies } from 'next/headers';
import type { Repository, Branch, PullRequestSummary } from '@/types';

const GITHUB_API_BASE = 'https://api.github.com';

export interface GitHubUserSession {
  token: string;
  login: string;
  avatarUrl?: string | null;
  installationId?: string | null;
  setupAction?: string | null;
  expiresAt: number;
}

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

export async function getGitHubSession(): Promise<GitHubUserSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('github_user_session');

  if (!sessionCookie?.value) {
    return null;
  }

  try {
    const session = JSON.parse(sessionCookie.value) as Partial<GitHubUserSession>;

    if (
      typeof session.token === 'string' &&
      session.token.trim() &&
      typeof session.login === 'string' &&
      session.login.trim() &&
      typeof session.expiresAt === 'number'
    ) {
      return {
        token: session.token.trim(),
        login: session.login.trim(),
        avatarUrl: typeof session.avatarUrl === 'string' ? session.avatarUrl : null,
        installationId: typeof session.installationId === 'string' ? session.installationId : null,
        setupAction: typeof session.setupAction === 'string' ? session.setupAction : null,
        expiresAt: session.expiresAt,
      };
    }
  } catch {
    // Ignore malformed cookie values and fall back to any configured server token.
  }

  return null;
}

export async function getGitHubAccessTokenFromSession({ allowFallback = false }: { allowFallback?: boolean } = {}): Promise<string> {
  const session = await getGitHubSession();

  if (session?.token) {
    return session.token;
  }

  if (allowFallback) {
    const fallbackToken = process.env.GITHUB_TOKEN?.trim();

    if (fallbackToken) {
      return fallbackToken;
    }
  }

  throw new Error('No authenticated GitHub user session is available for this request.');
}

async function resolveGitHubAccessToken(tokenOverride?: string): Promise<{ token: string; source: 'override' | 'session' | 'fallback' }> {
  const explicitToken = tokenOverride?.trim();

  if (explicitToken) {
    return { token: explicitToken, source: 'override' };
  }

  const session = await getGitHubSession();

  if (session?.token) {
    return { token: session.token, source: 'session' };
  }

  const fallbackToken = process.env.GITHUB_TOKEN?.trim();

  if (fallbackToken) {
    console.warn('[github-auth] Using development GITHUB_TOKEN fallback because no authenticated session was found.');
    return { token: fallbackToken, source: 'fallback' };
  }

  throw new Error('GitHub access token is not configured on the server.');
}

async function getGitHubHeaders(tokenOverride?: string): Promise<HeadersInit> {
  const { token } = await resolveGitHubAccessToken(tokenOverride);

  return {
    Authorization: `Bearer ${token}`,
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

async function githubFetch<T>(url: string, tokenOverride?: string): Promise<T> {
  try {
    const response = await fetch(url, {
      headers: await getGitHubHeaders(tokenOverride),
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

async function githubFetchWithHeaders<T>(url: string, tokenOverride?: string): Promise<{ data: T; headers: Headers }> {
  try {
    const response = await fetch(url, {
      headers: await getGitHubHeaders(tokenOverride),
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      const detail = parseGitHubErrorBody(errorText);
      throw normalizeGitHubStatusError(response.status, detail);
    }

    return {
      data: (await response.json()) as T,
      headers: response.headers,
    };
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

function getNextPageUrl(linkHeader: string | null): string | null {
  if (!linkHeader) {
    return null;
  }

  const matches = linkHeader.split(',');

  for (const match of matches) {
    const linkMatch = match.match(/<([^>]+)>;\s*rel="next"/i);
    if (linkMatch?.[1]) {
      return linkMatch[1];
    }
  }

  return null;
}

function isTargetGitHubAppInstallation(installation: Record<string, unknown>): boolean {
  const appSlug = typeof installation.app_slug === 'string'
    ? installation.app_slug.trim().toLowerCase()
    : '';

  const appIdValue = installation.app_id;
  const appId = typeof appIdValue === 'number'
    ? appIdValue
    : typeof appIdValue === 'string' && appIdValue.trim() !== ''
      ? Number(appIdValue)
      : Number.NaN;

  return appSlug === 'ai-code-automation' || (!Number.isNaN(appId) && appId === 5021652);
}

async function getGitHubAppInstallations(tokenOverride?: string): Promise<Array<Record<string, unknown>>> {
  const installations: Array<Record<string, unknown>> = [];
  let nextUrl: string | null = `${GITHUB_API_BASE}/user/installations?per_page=100`;

  while (nextUrl) {
    const installationPage: {
      data: { installations?: Array<Record<string, unknown>> };
      headers: Headers;
    } = await githubFetchWithHeaders<{ installations?: Array<Record<string, unknown>> }>(nextUrl, tokenOverride);
    const pageInstallations: Array<Record<string, unknown>> = Array.isArray(installationPage.data.installations)
      ? installationPage.data.installations
      : [];

    installations.push(...pageInstallations.filter((installation): installation is Record<string, unknown> => Boolean(installation && typeof installation === 'object')));

    nextUrl = getNextPageUrl(installationPage.headers.get('link')) ?? null;
  }

  return installations;
}

async function getRepositoriesForInstallation(installationId: string | number, tokenOverride?: string): Promise<Repository[]> {
  const repositories: Repository[] = [];
  const uniqueRepositories = new Map<string, Repository>();
  let nextUrl: string | null = `${GITHUB_API_BASE}/user/installations/${installationId}/repositories?per_page=100`;

  while (nextUrl) {
    const repositoryPage: {
      data: { repositories?: Array<Record<string, unknown>> };
      headers: Headers;
    } = await githubFetchWithHeaders<{ repositories?: Array<Record<string, unknown>> }>(nextUrl, tokenOverride);
    const pageRepositories: Array<Record<string, unknown>> = Array.isArray(repositoryPage.data.repositories)
      ? repositoryPage.data.repositories
      : [];

    pageRepositories
      .filter((repo): repo is Record<string, unknown> => Boolean(repo && typeof repo === 'object'))
      .map((repo) => normalizeRepository(repo))
      .forEach((repo) => {
        const key = `${repo.owner}/${repo.name}`.toLowerCase();
        if (!uniqueRepositories.has(key)) {
          uniqueRepositories.set(key, repo);
        }
      });

    nextUrl = getNextPageUrl(repositoryPage.headers.get('link')) ?? null;
  }

  uniqueRepositories.forEach((repo) => repositories.push(repo));
  return repositories;
}

// ──────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────

/**
 * Return all repositories accessible to the authenticated GitHub App installation.
 */
export async function getRepositories(tokenOverride?: string): Promise<Repository[]> {
  const installations = await getGitHubAppInstallations(tokenOverride);
  const appInstallations = installations.filter(isTargetGitHubAppInstallation);

  if (!appInstallations.length) {
    return [];
  }

  const uniqueRepositories = new Map<string, Repository>();

  for (const installation of appInstallations) {
    const installationId = installation.id;

    if (typeof installationId !== 'number' && typeof installationId !== 'string') {
      continue;
    }

    const repos = await getRepositoriesForInstallation(installationId, tokenOverride);

    repos.forEach((repo) => {
      const key = `${repo.owner}/${repo.name}`.toLowerCase();
      if (!uniqueRepositories.has(key)) {
        uniqueRepositories.set(key, repo);
      }
    });
  }

  return [...uniqueRepositories.values()];
}

/**
 * Return a single repository by full name.
 */
export async function getRepository(
  fullName: string,
  tokenOverride?: string
): Promise<Repository | null> {
  const [owner, repoName] = fullName.split('/');

  if (!owner || !repoName) {
    return null;
  }

  try {
    const repo = await githubFetch<Record<string, unknown>>(
      `${GITHUB_API_BASE}/repos/${owner}/${repoName}`,
      tokenOverride
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
export async function getBranches(repoFullName: string, tokenOverride?: string): Promise<Branch[]> {
  const [owner, repoName] = repoFullName.split('/');

  if (!owner || !repoName) {
    return [];
  }

  const branches = await githubFetch<Array<Record<string, unknown>>>(
    `${GITHUB_API_BASE}/repos/${owner}/${repoName}/branches`,
    tokenOverride
  );

  return branches
    .filter((branch) => branch && typeof branch === 'object')
    .map((branch) => normalizeBranch(branch));
}

export async function getOpenPullRequests(
  repoFullName: string,
  tokenOverride?: string
): Promise<PullRequestSummary[]> {
  const [owner, repoName] = repoFullName.split('/');

  if (!owner || !repoName) {
    return [];
  }

  const pulls = await githubFetch<Array<Record<string, unknown>>>(
    `${GITHUB_API_BASE}/repos/${owner}/${repoName}/pulls?state=open&per_page=100`,
    tokenOverride
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
  branchName: string,
  tokenOverride?: string
): Promise<boolean> {
  const branches = await getBranches(repoFullName, tokenOverride);
  return branches.some((b) => b.name === branchName);
}

/**
 * Return an existing open PR for the same repository + source branch + target branch.
 * This prevents duplicate PR creation when the user retries the same branch pairing.
 */
export async function findOpenPullRequest(
  repoFullName: string,
  sourceBranch: string,
  targetBranch: string,
  tokenOverride?: string
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
      `${GITHUB_API_BASE}/repos/${owner}/${repoName}/pulls?state=open&head=${owner}:${sourceBranch}&base=${targetBranch}`,
      tokenOverride
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
