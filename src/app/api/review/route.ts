import { NextRequest, NextResponse } from 'next/server';
import { createPullRequestReview } from '@/lib/n8n';
import {
  getRepository,
  branchExists,
  findOpenPullRequest,
  normalizeGitHubError,
} from '@/lib/github';
import type { CreateReviewRequest } from '@/types';

/**
 * POST /api/review
 *
 * Validates the request, then delegates to the n8n webhook service.
 * This route is the only place in the application that talks to n8n.
 *
 * Request body:
 * {
 *   "repository": "Zafarebad/test-ai-review",
 *   "source_branch": "feat/brevo",
 *   "target_branch": "main",
 *   "ai_review": true,
 *   "telegram": true
 * }
 */
export async function POST(req: NextRequest) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON in request body.' },
      { status: 400 }
    );
  }

  // ── Field presence check ────────────────────────────────────────────────────
  const {
    repository,
    source_branch,
    target_branch,
    ai_review,
    telegram,
  } = body as Partial<CreateReviewRequest>;

  if (!repository || typeof repository !== 'string') {
    return NextResponse.json(
      { success: false, error: 'A repository must be selected.' },
      { status: 400 }
    );
  }
  if (!source_branch || typeof source_branch !== 'string') {
    return NextResponse.json(
      { success: false, error: 'A source branch must be selected.' },
      { status: 400 }
    );
  }
  if (!target_branch || typeof target_branch !== 'string') {
    return NextResponse.json(
      { success: false, error: 'A target branch must be selected.' },
      { status: 400 }
    );
  }

  // ── Business rules ──────────────────────────────────────────────────────────
  if (source_branch === target_branch) {
    return NextResponse.json(
      {
        success: false,
        error: 'Source and target branches cannot be the same.',
      },
      { status: 422 }
    );
  }

  // ── Repository existence check (uses mock/service layer) ───────────────────
  try {
    const repo = await getRepository(repository);
    if (!repo) {
      return NextResponse.json(
        {
          success: false,
          error: `Repository "${repository}" was not found. Please check the repository name.`,
        },
        { status: 404 }
      );
    }
  } catch (error: unknown) {
    const normalized = normalizeGitHubError(error);
    return NextResponse.json(
      {
        success: false,
        error: normalized.message,
      },
      { status: normalized.status }
    );
  }

  // ── Branch existence checks ─────────────────────────────────────────────────
  try {
    const [sourceExists, targetExists] = await Promise.all([
      branchExists(repository, source_branch),
      branchExists(repository, target_branch),
    ]);

    if (!sourceExists) {
      return NextResponse.json(
        {
          success: false,
          error: `Source branch "${source_branch}" was not found in ${repository}.`,
        },
        { status: 404 }
      );
    }
    if (!targetExists) {
      return NextResponse.json(
        {
          success: false,
          error: `Target branch "${target_branch}" was not found in ${repository}.`,
        },
        { status: 404 }
      );
    }
  } catch (error: unknown) {
    const normalized = normalizeGitHubError(error);
    return NextResponse.json(
      {
        success: false,
        error: normalized.message,
      },
      { status: normalized.status }
    );
  }

  // ── Reuse an existing open PR when the same branch pairing already exists ──
  try {
    const existingOpenPR = await findOpenPullRequest(repository, source_branch, target_branch);

    if (existingOpenPR) {
      return NextResponse.json(
        {
          success: true,
          pr_exists: true,
          pr_created: false,
          pr_number: existingOpenPR.number,
          repository: existingOpenPR.repository,
          source_branch: existingOpenPR.source_branch,
          target_branch: existingOpenPR.target_branch,
          review_completed: false,
          comment_posted: false,
          telegram_sent: Boolean(telegram ?? false),
          pr_url: existingOpenPR.url,
        },
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: unknown) {
    const normalized = normalizeGitHubError(error);
    return NextResponse.json(
      {
        success: false,
        error: normalized.message,
      },
      { status: normalized.status }
    );
  }

  // ── Delegate to n8n ─────────────────────────────────────────────────────────
  const payload: CreateReviewRequest = {
    repository,
    source_branch,
    target_branch,
    ai_review: Boolean(ai_review ?? true),
    telegram: Boolean(telegram ?? false),
  };

  const result = await createPullRequestReview(payload);

  if (!result || typeof result !== 'object') {
    return NextResponse.json(
      {
        success: false,
        error: 'The automation service returned an invalid response.',
      },
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const statusCode = result.success ? 200 : 500;

  return NextResponse.json(result, {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' },
  });
}
