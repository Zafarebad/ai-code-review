/**
 * n8n Service — server-side only
 *
 * Provides a clean abstraction over the n8n webhook. React components
 * must NEVER import this module directly — they should call the Next.js
 * API route at /api/review instead.
 *
 * Environment variable (server-only, no NEXT_PUBLIC_ prefix):
 *   N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/ai-code-review
 *
 * If N8N_WEBHOOK_URL is not set, the service returns a realistic mock
 * response so the UI can be developed/tested without a live n8n instance.
 */

import type { CreateReviewRequest, ReviewResponse, PRResult } from '@/types';

const N8N_TIMEOUT_MS = 120_000; // 2 minutes — AI review + GitHub ops can be slow

// ──────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────

/**
 * Send a review request to the n8n webhook and return the structured result.
 */
export async function createPullRequestReview(
  payload: CreateReviewRequest
): Promise<ReviewResponse> {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn(
      '[n8n] N8N_WEBHOOK_URL is not set — returning mock response for development.'
    );
    return buildMockResponse(payload);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), N8N_TIMEOUT_MS);

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await safeReadText(response);
      console.error('[n8n] Non-2xx response:', response.status, errorBody);
      return {
        success: false,
        error: mapHttpStatusToUserMessage(response.status),
        detail: `HTTP ${response.status}: ${errorBody}`,
      };
    }

    const text = await safeReadText(response);
    const data = safeJsonParse(text);
    return normalizeN8nResponse(data, payload);
  } catch (err: unknown) {
    clearTimeout(timeoutId);

    if (err instanceof Error && err.name === 'AbortError') {
      return {
        success: false,
        error:
          'The request timed out. The AI review may still be running in n8n — please check your GitHub Pull Request for the review comment.',
      };
    }

    console.error('[n8n] Unexpected error:', err);
    return {
      success: false,
      error:
        'Failed to connect to the automation service. Please verify that n8n is running and the webhook URL is correct.',
      detail: err instanceof Error ? err.message : String(err),
    };
  }
}

// ──────────────────────────────────────────────
// Internal helpers
// ──────────────────────────────────────────────

async function safeReadText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return '(could not read response body)';
  }
}

function safeJsonParse(raw: string): unknown {
  if (!raw || !raw.trim()) {
    return {
      success: false,
      error: 'The automation service returned an empty response body.',
      detail: 'n8n responded without a JSON payload.',
    };
  }

  try {
    return JSON.parse(raw);
  } catch {
    return {
      success: false,
      error: 'The automation service returned a non-JSON response body.',
      detail: raw,
    };
  }
}

function mapHttpStatusToUserMessage(status: number): string {
  switch (status) {
    case 400:
      return 'The automation service rejected the request. Please check your inputs.';
    case 401:
    case 403:
      return 'Authentication failed. Please check the GitHub credentials in n8n.';
    case 404:
      return 'The repository or branch was not found. Please verify the repository name and branch names.';
    case 422:
      return 'GitHub rejected the Pull Request creation. A PR between these branches may already exist or no commits differ.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
    case 502:
    case 503:
      return 'The automation service encountered an internal error. Please check the n8n workflow logs.';
    default:
      return `Unexpected error from the automation service (HTTP ${status}).`;
  }
}

/**
 * Normalise the raw n8n response into our typed ReviewResponse.
 * n8n may return an array (when using "Respond to Webhook" node) or an object.
 */
function normalizeN8nResponse(
  data: unknown,
  payload: CreateReviewRequest
): ReviewResponse {
  // n8n sometimes wraps the response in an array
  const raw = Array.isArray(data) ? data[0] : data;

  if (typeof raw !== 'object' || raw === null) {
    return {
      success: false,
      error: 'Received an unexpected response format from the automation service.',
      detail: JSON.stringify(data),
    };
  }

  const obj = raw as Record<string, unknown>;

  // If n8n explicitly signals failure
  if (obj.success === false) {
    return {
      success: false,
      error: String(obj.error ?? 'An unknown error occurred in the workflow.'),
      detail: String(obj.detail ?? ''),
    };
  }

  const hasExplicitSuccessSignal =
    obj.success === true ||
    obj.review_completed === true ||
    obj.comment_posted === true ||
    obj.pr_exists === true ||
    obj.pr_created === true;

  if (!hasExplicitSuccessSignal) {
    return {
      success: false,
      error: 'The automation service did not confirm the requested operation completed.',
      detail: JSON.stringify(obj),
    };
  }

  // Build a successful PRResult — fill in defaults from the request payload
  // if the n8n response is missing some fields (defensive)
  const result: PRResult = {
    success: true,
    pr_exists: Boolean(obj.pr_exists ?? false),
    pr_created: Boolean(obj.pr_created ?? !obj.pr_exists),
    pr_number: Number(obj.pr_number ?? 0),
    repository: String(obj.repository ?? payload.repository),
    source_branch: String(obj.source_branch ?? payload.source_branch),
    target_branch: String(obj.target_branch ?? payload.target_branch),
    review_completed: Boolean(obj.review_completed ?? false),
    comment_posted: Boolean(obj.comment_posted ?? false),
    telegram_sent: Boolean(obj.telegram_sent ?? false),
    pr_url: String(
      obj.pr_url ??
        `https://github.com/${payload.repository}/pulls`
    ),
  };

  return result;
}

// ──────────────────────────────────────────────
// Development mock
// ──────────────────────────────────────────────

async function buildMockResponse(
  payload: CreateReviewRequest
): Promise<PRResult> {
  // Simulate network latency for a realistic dev experience
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Toggle between "new PR" and "existing PR" scenarios based on branch name
  const isExisting = payload.source_branch === 'feat/brevo';

  return {
    success: true,
    pr_exists: isExisting,
    pr_created: !isExisting,
    pr_number: isExisting ? 24 : 42,
    repository: payload.repository,
    source_branch: payload.source_branch,
    target_branch: payload.target_branch,
    review_completed: payload.ai_review,
    comment_posted: payload.ai_review,
    telegram_sent: payload.telegram,
    pr_url: `https://github.com/${payload.repository}/pull/${isExisting ? 24 : 42}`,
  };
}
