import { NextRequest, NextResponse } from 'next/server';

const GITHUB_APP_AUTH_URL = 'https://github.com/login/oauth/authorize';

function getClientId(): string {
  const clientId = process.env.GITHUB_APP_CLIENT_ID;

  if (!clientId || !clientId.trim()) {
    throw new Error('Missing GITHUB_APP_CLIENT_ID environment variable.');
  }

  return clientId.trim();
}

function getRedirectUri(request: NextRequest): string {
  return new URL('/api/auth/github/callback', request.url).toString();
}

export async function GET(request: NextRequest) {
  try {
    const clientId = getClientId();
    const redirectUri = getRedirectUri(request);

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'read:user,repo',
      allow_signup: 'true',
    });

    return NextResponse.redirect(`${GITHUB_APP_AUTH_URL}?${params.toString()}`);
  } catch (error: unknown) {
    console.error('[/api/auth/github/login]', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'GitHub login is not configured.',
      },
      { status: 500 }
    );
  }
}
