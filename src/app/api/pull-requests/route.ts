import { NextRequest, NextResponse } from 'next/server';
import { getGitHubAccessTokenFromSession, getOpenPullRequests, normalizeGitHubError } from '@/lib/github';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const repository = searchParams.get('repository');

  if (!repository || !repository.trim() || !repository.includes('/')) {
    return NextResponse.json(
      {
        success: false,
        error: 'A repository query parameter is required in the format owner/repo.',
      },
      { status: 400 }
    );
  }

  try {
    const token = await getGitHubAccessTokenFromSession();
    const pullRequests = await getOpenPullRequests(repository.trim(), token);

    return NextResponse.json({
      success: true,
      pullRequests,
    });
  } catch (error: unknown) {
    const normalized = normalizeGitHubError(error);

    return NextResponse.json(
      {
        success: false,
        error: normalized.message,
      },
      {
        status: normalized.status,
      }
    );
  }
}
