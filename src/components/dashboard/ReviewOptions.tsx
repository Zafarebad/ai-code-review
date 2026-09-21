'use client';

import { Bot, Send } from 'lucide-react';

interface ReviewOptionsProps {
  aiReview: boolean;
  telegram: boolean;
  onAiReviewChange: (value: boolean) => void;
  onTelegramChange: (value: boolean) => void;
  disabled?: boolean;
}

export function ReviewOptions({
  aiReview,
  telegram,
  onAiReviewChange,
  onTelegramChange,
  disabled,
}: ReviewOptionsProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-[var(--color-text-secondary)]">Options</p>
      <div className="flex flex-col gap-2">
        <OptionToggle
          id="opt-ai-review"
          icon={<Bot size={14} />}
          label="AI Code Review"
          description="Run Claude AI analysis and post review as a GitHub comment"
          checked={aiReview}
          onChange={onAiReviewChange}
          disabled={disabled}
        />
        <OptionToggle
          id="opt-telegram"
          icon={<Send size={14} />}
          label="Telegram Notification"
          description="Send a notification to your Telegram channel when complete"
          checked={telegram}
          onChange={onTelegramChange}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

// ── Internal toggle ────────────────────────────────────────────────────────────

interface OptionToggleProps {
  id: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

function OptionToggle({
  id,
  icon,
  label,
  description,
  checked,
  onChange,
  disabled,
}: OptionToggleProps) {
  return (
    <label
      htmlFor={id}
      className={[
        'flex items-start gap-3 px-4 py-3 rounded-[var(--radius-md)] border cursor-pointer',
        'transition-all duration-150 select-none',
        checked
          ? 'bg-[var(--color-brand-900)] border-[var(--color-brand-700)]'
          : 'bg-[var(--color-surface-3)] border-[var(--color-border)]',
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-[var(--color-brand-700)]',
      ].join(' ')}
    >
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only"
        aria-describedby={`${id}-desc`}
      />
      {/* Custom checkbox visual */}
      <div
        className={[
          'mt-0.5 w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors',
          checked
            ? 'bg-[var(--color-brand-600)] border-[var(--color-brand-500)]'
            : 'bg-[var(--color-surface-4)] border-[var(--color-border)]',
        ].join(' ')}
        aria-hidden="true"
      >
        {checked && (
          <svg width="9" height="7" viewBox="0 0 9 7" fill="none" aria-hidden="true">
            <path
              d="M1 3.5L3.5 6L8 1"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className={[
              'text-xs',
              checked ? 'text-[var(--color-brand-400)]' : 'text-[var(--color-text-tertiary)]',
            ].join(' ')}
          >
            {icon}
          </span>
          <span className="text-sm font-medium text-[var(--color-text-primary)]">
            {label}
          </span>
        </div>
        <p
          id={`${id}-desc`}
          className="text-xs text-[var(--color-text-tertiary)] mt-0.5 leading-relaxed"
        >
          {description}
        </p>
      </div>
    </label>
  );
}
