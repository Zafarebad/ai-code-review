import type { Metadata } from 'next';
import { ShieldCheck, KeyRound, Globe, CheckCircle2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Manage platform settings and automation configurations.',
};

export default function SettingsPage() {
  const isN8nConfigured = Boolean(process.env.N8N_WEBHOOK_URL);

  return (
    <div>
      <Header
        title="Settings & Configuration"
        subtitle="Review connected automation endpoints, security architecture, and environment configuration."
      />

      <div className="p-6 max-w-5xl space-y-6">
        {/* Status Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-[var(--radius-lg)] bg-[var(--color-surface-1)] border border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                isN8nConfigured
                  ? 'bg-[var(--color-success-text)] shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                  : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]'
              }`}
            />
            <div>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">
                n8n Webhook Service:{' '}
                <span className="font-semibold">
                  {isN8nConfigured ? 'Connected (Production)' : 'Mock Development Mode'}
                </span>
              </p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                {isN8nConfigured
                  ? 'Requests are routed directly to your live n8n automation workflow.'
                  : 'N8N_WEBHOOK_URL is not set. The platform runs in simulated mock mode for safe local testing.'}
              </p>
            </div>
          </div>
          <Badge variant={isN8nConfigured ? 'success' : 'warning'}>
            {isN8nConfigured ? 'LIVE ENDPOINT' : 'SIMULATION MODE'}
          </Badge>
        </div>

        {/* Grid of config sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Webhook Endpoint Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe size={18} className="text-[var(--color-brand-400)]" />
                <CardTitle>Webhook Configuration</CardTitle>
              </div>
              <CardDescription>
                Target webhook URL receiving AI code review trigger events.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-[var(--radius-md)] bg-[var(--color-surface-2)] border border-[var(--color-border)]">
                <p className="text-xs font-mono text-[var(--color-text-secondary)] break-all">
                  {process.env.N8N_WEBHOOK_URL || 'https://your-n8n-instance.com/webhook/ai-code-review'}
                </p>
              </div>
              <div className="text-xs text-[var(--color-text-tertiary)] space-y-1">
                <p>• Configured via server-side <code className="text-[var(--color-brand-300)]">N8N_WEBHOOK_URL</code></p>
                <p>• Secret is never exposed to the client browser</p>
                <p>• 120-second timeout window for deep LLM code analysis</p>
              </div>
            </CardContent>
          </Card>

          {/* Security & Credentials Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-[var(--color-success-text)]" />
                <CardTitle>Security Architecture</CardTitle>
              </div>
              <CardDescription>
                Zero-credential client principle and credential isolation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-[var(--color-success-text)] shrink-0 mt-0.5" />
                <p className="text-xs text-[var(--color-text-secondary)]">
                  <strong className="text-[var(--color-text-primary)]">GitHub PAT:</strong> Stored strictly in n8n credentials vault.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-[var(--color-success-text)] shrink-0 mt-0.5" />
                <p className="text-xs text-[var(--color-text-secondary)]">
                  <strong className="text-[var(--color-text-primary)]">Anthropic Claude Key:</strong> Handled entirely within the n8n AI node.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-[var(--color-success-text)] shrink-0 mt-0.5" />
                <p className="text-xs text-[var(--color-text-secondary)]">
                  <strong className="text-[var(--color-text-primary)]">Telegram Bot Token:</strong> Never transmitted across frontend network traffic.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Environment Variables Reference Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <KeyRound size={18} className="text-[var(--color-warning-text)]" />
              <CardTitle>Environment Variables Guide</CardTitle>
            </div>
            <CardDescription>
              Variables required for running the platform locally or deploying to production.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-[var(--color-text-tertiary)]">
                    <th className="py-2.5 px-3 font-semibold">Variable</th>
                    <th className="py-2.5 px-3 font-semibold">Required</th>
                    <th className="py-2.5 px-3 font-semibold">Location</th>
                    <th className="py-2.5 px-3 font-semibold">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)] text-[var(--color-text-secondary)] font-mono">
                  <tr>
                    <td className="py-2.5 px-3 text-[var(--color-brand-300)]">N8N_WEBHOOK_URL</td>
                    <td className="py-2.5 px-3 text-[var(--color-warning-text)] font-sans">Optional in dev</td>
                    <td className="py-2.5 px-3 font-sans">.env.local (Server)</td>
                    <td className="py-2.5 px-3 font-sans">Full URL to n8n webhook endpoint</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 text-[var(--color-text-tertiary)]">GITHUB_TOKEN</td>
                    <td className="py-2.5 px-3 font-sans">Required</td>
                    <td className="py-2.5 px-3 font-sans">n8n Credentials</td>
                    <td className="py-2.5 px-3 font-sans">Personal Access Token with <code className="text-xs">repo</code> scope</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 text-[var(--color-text-tertiary)]">ANTHROPIC_API_KEY</td>
                    <td className="py-2.5 px-3 font-sans">Required</td>
                    <td className="py-2.5 px-3 font-sans">n8n Credentials</td>
                    <td className="py-2.5 px-3 font-sans">Claude API Key for deep code review</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 text-[var(--color-text-tertiary)]">TELEGRAM_BOT_TOKEN</td>
                    <td className="py-2.5 px-3 font-sans">Optional</td>
                    <td className="py-2.5 px-3 font-sans">n8n Credentials</td>
                    <td className="py-2.5 px-3 font-sans">Telegram Bot token for PR notifications</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
