import type { Metadata } from 'next';
import PullRequestsClient from './PullRequestsClient';

export const metadata: Metadata = {
  title: 'Pull Requests',
  description: 'View and manage your Pull Requests.',
};

export default function PullRequestsPage() {
  return <PullRequestsClient />;
}
