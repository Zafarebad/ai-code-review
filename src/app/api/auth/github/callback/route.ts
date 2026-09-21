import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const GITHUB_OAUTH_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const GITHUB_USER_API_URL = 'https://api.github.com/user';
const SESSION_COOKIE_NAME = 'github_user_session';

function getGitHubClientId(): string {
  const clientId = process.env.GITHUB_APP_CLIENT_ID;

  if (!clientId || !clientId.trim()) {
    throw new Error('Missing GITHUB_APP_CLIENT_ID environment variable.');
  }

  return clientId.trim();
}

function getGitHubClientSecret(): string {
  const clientSecret = process.env.GITHUB_APP_CLIENT_SECRET;

  if (!clientSecret || !clientSecret.trim()) {
    throw new Error('Missing GITHUB_APP_CLIENT_SECRET environment variable.');
  }

  return clientSecret.trim();
}

async function exchangeCodeForToken(code: string, redirectUri: string) {
  const response = await fetch(GITHUB_OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'ai-code-review-app',
    },
    body: JSON.stringify({
      client_id: getGitHubClientId(),
      client_secret: getGitHubClientSecret(),
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub OAuth token exchange failed: ${text || response.statusText}`);
  }

  const payload = (await response.json()) as {
    access_token?: string;
    error?: string;
    error_description?: string;
    error_uri?: string;
  };

  if (!payload.access_token) {
    throw new Error(
      payload.error_description || payload.error || 'GitHub OAuth token exchange returned no access token.'
    );
  }

  return payload.access_token;
}

async function getGitHubUser(accessToken: string) {
  const response = await fetch(GITHUB_USER_API_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'ai-code-review-app',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub user lookup failed: ${text || response.statusText}`);
  }

  return (await response.json()) as {
    login?: string;
    avatar_url?: string | null;
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const installationId = searchParams.get('installation_id');
  const setupAction = searchParams.get('setup_action');

  if (!code || !code.trim()) {
    return NextResponse.json(
      { success: false, error: 'Missing GitHub OAuth code.' },
      { status: 400 }
    );
  }

  const redirectUri = new URL('/api/auth/github/callback', request.url).toString();

  try {
    const accessToken = await exchangeCodeForToken(code, redirectUri);
    const user = await getGitHubUser(accessToken);

    const cookieStore = await cookies();
    const sessionPayload = {
      token: accessToken,
      login: user.login || 'github-user',
      avatarUrl: user.avatar_url ?? null,
      installationId: installationId ?? null,
      setupAction: setupAction ?? null,
      expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7,
    };

    cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify(sessionPayload), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error: unknown) {
    console.error('[/api/auth/github/callback]', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'GitHub authorization failed.',
      },
      { status: 500 }
    );
  }
}
