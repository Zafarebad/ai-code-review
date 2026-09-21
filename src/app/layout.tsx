import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppShell } from '@/components/layout/AppShell';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'AI Code Review',
    template: '%s | AI Code Review',
  },
  description:
    'Create, review and track GitHub Pull Requests with AI. Powered by Claude AI and n8n automation.',
  keywords: ['AI', 'code review', 'GitHub', 'Pull Request', 'Claude', 'n8n'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${inter.className}`}>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
