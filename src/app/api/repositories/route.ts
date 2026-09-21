import { NextResponse } from 'next/server';
import { getGitHubAccessTokenFromSession, getRepositories } from '@/lib/github';

/**
 * GET /api/repositories
 * Returns all repositories available to the authenticated GitHub user.
 * Server-side only — GitHub credentials never leave the server.
 */
export async function GET() {
  try {
    const token = await getGitHubAccessTokenFromSession();
    const repos = await getRepositories(token);
    return NextResponse.json({ repositories: repos });
  } catch (err: unknown) {
    console.error('[/api/repositories]', err);
    return NextResponse.json(
      { error: 'Failed to load repositories. Please authorize GitHub access.' },
      { status: 500 }
    );
  }
}
