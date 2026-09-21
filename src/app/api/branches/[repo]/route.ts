import { NextRequest, NextResponse } from 'next/server';
import { getBranches, getGitHubAccessTokenFromSession } from '@/lib/github';

interface RouteParams {
  params: Promise<{ repo: string }>;
}

/**
 * GET /api/branches/[repo]
 *
 * The repo segment is URL-encoded, e.g.:
 *   /api/branches/Zafarebad%2Ftest-ai-review
 *
 * Returns all branches for the given repository.
 * Server-side only — GitHub credentials never leave the server.
 */
export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { repo } = await params;
  const repoFullName = decodeURIComponent(repo);

  if (!repoFullName || !repoFullName.includes('/')) {
    return NextResponse.json(
      { error: 'Invalid repository name. Expected format: owner/repo' },
      { status: 400 }
    );
  }

  try {
    const token = await getGitHubAccessTokenFromSession();
    const branches = await getBranches(repoFullName, token);
    return NextResponse.json({ branches });
  } catch (err: unknown) {
    console.error('[/api/branches]', err);
    return NextResponse.json(
      { error: 'Failed to load branches.' },
      { status: 500 }
    );
  }
}
