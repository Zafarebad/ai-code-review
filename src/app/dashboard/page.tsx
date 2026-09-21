import type { Metadata } from 'next';
import { Header } from '@/components/layout/Header';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { ReviewForm } from '@/components/dashboard/ReviewForm';
import { Badge } from '@/components/ui/Badge';
import { BackgroundVideo } from '@/components/ui/BackgroundVideo';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Create Pull Requests and run AI code reviews from the dashboard.',
};

export default function DashboardPage() {
  return (
    <div className="relative min-h-full flex flex-col">
      {/* Background Video */}
      <BackgroundVideo src="/videos/bg-video.mp4" opacity={0.7} />

      {/* Foreground Content (z-10) */}
      <div className="relative z-10 flex-1 flex flex-col">
        <Header
          title="Dashboard"
          subtitle="Create and review Pull Requests with AI"
          actions={
            <Badge variant="brand" dot>
              n8n Connected
            </Badge>
          }
        />

        <div className="flex-1 px-6 py-8">
          <div className="max-w-2xl mx-auto space-y-8">
            <DashboardHeader />
            <ReviewForm />

            {/* Feature info cards with glassmorphism */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <InfoCard
                title="Smart PR Detection"
                description="Automatically detects existing open PRs for the same source → target branch combination. No duplicate PRs."
              />
              <InfoCard
                title="Claude AI Review"
                description="Uses Anthropic Claude to review your code for bugs, security issues, and quality improvements."
              />
              <InfoCard
                title="Instant Notifications"
                description="Optional Telegram notifications keep you informed the moment the review is complete."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="card p-4 space-y-1.5 hover:border-[var(--color-brand-500)]/40 transition-colors duration-200 shadow-lg">
      <p className="text-xs font-semibold text-[var(--color-text-primary)]">{title}</p>
      <p className="text-xs text-[var(--color-text-tertiary)] leading-relaxed">
        {description}
      </p>
    </div>
  );
}
