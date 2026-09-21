'use client';

import { useState, useCallback, useEffect } from 'react';
import { GitPullRequest } from 'lucide-react';
import { RepositorySelector } from './RepositorySelector';
import { BranchSelector } from './BranchSelector';
import { ReviewOptions } from './ReviewOptions';
import { WorkflowProgress } from './WorkflowProgress';
import { PRResultCard } from './PRResultCard';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { clearActivePR, getActivePR, saveActivePR } from '@/lib/active-pr';
import type { FormState, ReviewResponse, ReviewResult } from '@/types';

interface FormFields {
  repository: string;
  sourceBranch: string;
  targetBranch: string;
  aiReview: boolean;
  telegram: boolean;
}

interface FieldErrors {
  repository?: string;
  sourceBranch?: string;
  targetBranch?: string;
  branches?: string;
}

const DEFAULT_FIELDS: FormFields = {
  repository: '',
  sourceBranch: '',
  targetBranch: '',
  aiReview: true,
  telegram: false,
};

export function ReviewForm() {
  const [fields, setFields] = useState<FormFields>(DEFAULT_FIELDS);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formState, setFormState] = useState<FormState>({ status: 'idle' });

  const isLoading = formState.status === 'loading';

  useEffect(() => {
    const activePR = getActivePR();
    if (!activePR) {
      return;
    }

    setFields({
      repository: activePR.repository,
      sourceBranch: activePR.source_branch,
      targetBranch: activePR.target_branch,
      aiReview: true,
      telegram: false,
    });

    setFormState({
      status: 'success',
      result: {
        success: true,
        pr_exists: true,
        pr_created: false,
        pr_number: activePR.pr_number,
        repository: activePR.repository,
        source_branch: activePR.source_branch,
        target_branch: activePR.target_branch,
        review_completed: true,
        comment_posted: true,
        telegram_sent: false,
        pr_url: activePR.pr_url,
        ...(activePR.head_sha ? { head_sha: activePR.head_sha } : {}),
      } as ReviewResult,
    });
  }, []);

  // ── Field helpers ────────────────────────────────────────────────────────────

  const setField = useCallback(
    <K extends keyof FormFields>(key: K, value: FormFields[K]) => {
      setFields((prev) => ({ ...prev, [key]: value }));
      setFieldErrors((prev) => ({ ...prev, [key]: undefined, branches: undefined }));
    },
    []
  );

  const onRepoChange = useCallback(
    (repo: string) => {
      setFields((prev) => ({
        ...prev,
        repository: repo,
        sourceBranch: '',
        targetBranch: '',
      }));
      setFieldErrors({});
    },
    []
  );

  // ── Validation ────────────────────────────────────────────────────────────────

  function validate(): boolean {
    const errors: FieldErrors = {};

    if (!fields.repository) {
      errors.repository = 'Please select a repository.';
    }
    if (!fields.sourceBranch) {
      errors.sourceBranch = 'Please select a source branch.';
    }
    if (!fields.targetBranch) {
      errors.targetBranch = 'Please select a target branch.';
    }
    if (
      fields.sourceBranch &&
      fields.targetBranch &&
      fields.sourceBranch === fields.targetBranch
    ) {
      errors.branches = 'Source and target branches cannot be the same.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  // ── Submit ────────────────────────────────────────────────────────────────────

  async function readJsonResponseSafely(response: Response): Promise<unknown> {
    const text = await response.text();

    if (!text || !text.trim()) {
      return {
        success: false,
        error: 'The review service returned an empty response body.',
      };
    }

    try {
      return JSON.parse(text);
    } catch {
      return {
        success: false,
        error: 'The review service returned a non-JSON response body.',
        detail: text,
      };
    }
  }

  function normalizeReviewResponse(
    data: unknown,
    fallbackRepository: string,
    fallbackSourceBranch: string,
    fallbackTargetBranch: string
  ): ReviewResponse {
    const raw = Array.isArray(data) ? data[0] : data;

    if (!raw || typeof raw !== 'object') {
      return {
        success: false,
        error: 'Received an unexpected response format from the review service.',
      };
    }

    const item = raw as Record<string, unknown>;

    if (typeof item.body === 'string') {
      return {
        success: true,
        repository:
          typeof item.repository === 'string' ? item.repository : fallbackRepository,
        source_branch:
          typeof item.source_branch === 'string'
            ? item.source_branch
            : fallbackSourceBranch,
        target_branch:
          typeof item.target_branch === 'string'
            ? item.target_branch
            : fallbackTargetBranch,
        body: item.body,
        html_url:
          typeof item.html_url === 'string' ? item.html_url : undefined,
      } as ReviewResult;
    }

    if (item.success === false) {
      return {
        success: false,
        error:
          typeof item.error === 'string'
            ? item.error
            : typeof item.message === 'string'
              ? item.message
              : 'The review request failed.',
      };
    }

    if (item.review_skipped === true) {
      return {
        success: true,
        review_skipped: true,
        reason:
          typeof item.reason === 'string'
            ? item.reason
            : 'This PR commit has already been reviewed',
        repository:
          typeof item.repository === 'string' ? item.repository : fallbackRepository,
        pr_number:
          typeof item.pr_number === 'number' ? item.pr_number : undefined,
        head_sha: typeof item.head_sha === 'string' ? item.head_sha : undefined,
        source_branch:
          typeof item.source_branch === 'string'
            ? item.source_branch
            : fallbackSourceBranch,
        target_branch:
          typeof item.target_branch === 'string'
            ? item.target_branch
            : fallbackTargetBranch,
      } as ReviewResult;
    }

    const hasExplicitSuccessSignal =
      item.success === true ||
      item.review_completed === true ||
      item.comment_posted === true ||
      item.pr_exists === true ||
      item.pr_created === true;

    if (
      (typeof item.pr_exists === 'boolean' ||
        typeof item.pr_number === 'number' ||
        typeof item.review_completed === 'boolean' ||
        typeof item.pr_url === 'string') &&
      hasExplicitSuccessSignal
    ) {
      return {
        success: true,
        pr_exists: Boolean(item.pr_exists ?? false),
        pr_created: Boolean(item.pr_created ?? !item.pr_exists),
        pr_number: Number(item.pr_number ?? 0),
        repository:
          typeof item.repository === 'string' ? item.repository : fallbackRepository,
        source_branch:
          typeof item.source_branch === 'string'
            ? item.source_branch
            : fallbackSourceBranch,
        target_branch:
          typeof item.target_branch === 'string'
            ? item.target_branch
            : fallbackTargetBranch,
        review_completed: Boolean(item.review_completed ?? false),
        comment_posted: Boolean(item.comment_posted ?? false),
        telegram_sent: Boolean(item.telegram_sent ?? false),
        pr_url:
          typeof item.pr_url === 'string'
            ? item.pr_url
            : `https://github.com/${fallbackRepository}/pulls`,
      } as ReviewResult;
    }

    return {
      success: false,
      error: 'The review service returned an unexpected payload format.',
      detail: JSON.stringify(data),
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isLoading) return;
    if (!validate()) return;

    setFormState({ status: 'loading' });

    try {
      const response = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repository: fields.repository,
          source_branch: fields.sourceBranch,
          target_branch: fields.targetBranch,
          ai_review: true,
          telegram: false,
        }),
      });

      if (!response.ok) {
        let message = `The review request failed with status ${response.status}.`;

        try {
          const errorBody = await readJsonResponseSafely(response);
          if (errorBody && typeof errorBody === 'object') {
            const errorMessage =
              'error' in errorBody && typeof errorBody.error === 'string'
                ? errorBody.error
                : 'message' in errorBody && typeof errorBody.message === 'string'
                  ? errorBody.message
                  : null;

            if (errorMessage) {
              message = errorMessage;
            }
          }
        } catch {
          // Ignore JSON parse failures and keep the HTTP status fallback.
        }

        throw new Error(message);
      }

      const data = await readJsonResponseSafely(response);
      const normalized = normalizeReviewResponse(
        data,
        fields.repository,
        fields.sourceBranch,
        fields.targetBranch
      );

      if ('success' in normalized && normalized.success === false) {
        setFormState({
          status: 'error',
          message: normalized.error ?? 'The review request failed.',
        });
        return;
      }

      const result: ReviewResult = normalized as ReviewResult;

      if ('review_skipped' in result && result.review_skipped) {
        setFormState({ status: 'success', result });
        return;
      }

      if ('body' in result && typeof result.body === 'string') {
        setFormState({ status: 'success', result });
        return;
      }

      saveActivePR(result);
      setFormState({ status: 'success', result });
    } catch (err: unknown) {
      console.error('[ReviewForm] Submit error:', err);
      setFormState({
        status: 'error',
        message:
          err instanceof Error && err.message
            ? err.message
            : 'Could not connect to the production review service. Please check your connection and try again.',
      });
    }
  }

  function handleReset() {
    clearActivePR();
    setFormState({ status: 'idle' });
    setFieldErrors({});
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  const showForm = formState.status !== 'success';

  return (
    <div className="w-full max-w-lg">
      {/* Main card */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          noValidate
          className="card p-6 space-y-5"
          aria-label="Create Pull Request review form"
        >
          {/* Card title */}
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <GitPullRequest size={16} className="text-[var(--color-brand-400)]" />
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Create Pull Request
              </h2>
            </div>
            <p className="text-xs text-[var(--color-text-tertiary)] pl-6">
              Select a repository and branches to create or review a PR.
            </p>
          </div>

          {/* Repository */}
          <RepositorySelector
            value={fields.repository}
            onChange={onRepoChange}
            disabled={isLoading}
            error={fieldErrors.repository}
          />

          {/* Source branch */}
          <BranchSelector
            id="source-branch"
            label="Source Branch"
            repository={fields.repository}
            value={fields.sourceBranch}
            onChange={(v) => setField('sourceBranch', v)}
            excludeBranch={fields.targetBranch}
            disabled={isLoading}
            error={fieldErrors.sourceBranch}
            hint="The feature branch you want to merge from."
          />

          {/* Target branch */}
          <BranchSelector
            id="target-branch"
            label="Target Branch"
            repository={fields.repository}
            value={fields.targetBranch}
            onChange={(v) => setField('targetBranch', v)}
            excludeBranch={fields.sourceBranch}
            disabled={isLoading}
            error={fieldErrors.targetBranch}
            hint="The base branch you want to merge into."
          />

          {/* Same-branch error */}
          {fieldErrors.branches && (
            <Alert variant="warning">{fieldErrors.branches}</Alert>
          )}

          {/* Options */}
          <ReviewOptions
            aiReview={fields.aiReview}
            telegram={fields.telegram}
            onAiReviewChange={(v) => setField('aiReview', v)}
            onTelegramChange={(v) => setField('telegram', v)}
            disabled={isLoading}
          />

          {/* Loading state */}
          {isLoading && (
            <Alert variant="info" title="Generating AI review">
              Sending your review request to the production webhook. This can take 10–15 seconds while the AI review is generated.
            </Alert>
          )}

          {/* Error state */}
          {formState.status === 'error' && (
            <Alert
              variant="error"
              title="Something went wrong"
              onDismiss={() => setFormState({ status: 'idle' })}
            >
              {formState.message}
            </Alert>
          )}

          {/* Submit */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            disabled={isLoading}
            className="w-full"
            id="create-pr-button"
          >
            {isLoading ? 'Reviewing…' : 'Create Pull Request'}
          </Button>
        </form>
      )}

      {/* Workflow progress */}
      <WorkflowProgress isLoading={isLoading} />

      {/* Success result */}
      {formState.status === 'success' && (
        <PRResultCard result={formState.result} onReset={handleReset} />
      )}
    </div>
  );
}
