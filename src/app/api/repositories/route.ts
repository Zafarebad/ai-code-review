import { NextResponse } from 'next/server';
import { getRepositories } from '@/lib/github';

/**
 * GET /api/repositories
 * Returns all repositories available to the application.
 * Server-side only — GitHub credentials never leave the server.
 */
export async function GET() {
  try {
    const repos = await getRepositories();
    return NextResponse.json({ repositories: repos });
  } catch (err: unknown) {
    console.error('[/api/repositories]', err);
    return NextResponse.json(
      { error: 'Failed to load repositories.' },
      { status: 500 }
    );
  }
}
