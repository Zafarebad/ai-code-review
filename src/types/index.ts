// ──────────────────────────────────────────────
// Domain Types
// ──────────────────────────────────────────────

export interface Repository {
  id: string;
  /** Full name e.g. "Zafarebad/test-ai-review" */
  fullName: string;
  /** Short display name e.g. "test-ai-review" */
  name: string;
  owner: string;
  description?: string;
  private: boolean;
  url: string;
  defaultBranch: string;
}

export interface Branch {
  name: string;
  /** SHA of the branch tip */
  sha: string;
  protected: boolean;
}

export interface PullRequestSummary {
  number: number;
  title: string;
  repository: string;
  source_branch: string;
  target_branch: string;
  state: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  author_login: string | null;
}

// ──────────────────────────────────────────────
// Review Request / Response
// ──────────────────────────────────────────────

export interface ReviewOptions {
  aiReview: boolean;
  telegramNotification: boolean;
}

export interface CreateReviewRequest {
  repository: string;      // full name, e.g. "Zafarebad/test-ai-review"
  source_branch: string;   // head / feature branch
  target_branch: string;   // base / main branch
  ai_review: boolean;
  telegram: boolean;
}

export interface PRResult {
  success: true;
  pr_exists: boolean;
  pr_created: boolean;
  pr_number: number;
  repository: string;
  source_branch: string;
  target_branch: string;
  review_completed: boolean;
  comment_posted: boolean;
  telegram_sent: boolean;
  pr_url: string;
}

export interface GitHubReviewCommentResult {
  success?: true;
  repository?: string;
  source_branch?: string;
  target_branch?: string;
  body: string;
  html_url?: string;
}

export interface ReviewSkippedResponse {
  success: true;
  review_skipped: true;
  reason: string;
  repository?: string;
  pr_number?: number;
  head_sha?: string;
  source_branch?: string;
  target_branch?: string;
}

export type ReviewResult = PRResult | GitHubReviewCommentResult | ReviewSkippedResponse;
export type ReviewResponse = ReviewResult | APIError;

// ──────────────────────────────────────────────
// API Error
// ──────────────────────────────────────────────

export interface APIError {
  success: false;
  error: string;
  /** Optional technical detail — shown only in dev mode */
  detail?: string;
}

// ──────────────────────────────────────────────
// UI State Machine
// ──────────────────────────────────────────────

export type FormState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; result: ReviewResult }
  | { status: 'error'; message: string };

export interface WorkflowStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'done' | 'error';
}

// ──────────────────────────────────────────────
// Service layer shapes (future-ready)
// ──────────────────────────────────────────────

export interface GitHubServiceConfig {
  token?: string;           // server-side only
  baseUrl?: string;         // override for GHE
}

export interface N8nServiceConfig {
  webhookUrl: string;
  secret?: string;
  timeoutMs: number;
}
