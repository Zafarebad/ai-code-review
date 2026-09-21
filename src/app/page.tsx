import { redirect } from 'next/navigation';

/**
 * Root page — redirect to dashboard.
 * Using Next.js redirect() from a Server Component so there's no flash.
 */
export default function RootPage() {
  redirect('/dashboard');
}
