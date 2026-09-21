import type { Repository, Branch } from '@/types';

// ──────────────────────────────────────────────────────────────────────────────
// Mock Data
//
// This file provides realistic mock data used during development when the
// GitHub API is not yet wired up. Replace the mock implementations in
// src/lib/github.ts with real GitHub REST API calls when ready.
// ──────────────────────────────────────────────────────────────────────────────

export const MOCK_REPOSITORIES: Repository[] = [
  {
    id: 'repo-1',
    fullName: 'Zafarebad/test-ai-review',
    name: 'test-ai-review',
    owner: 'Zafarebad',
    description: 'AI-powered code review test repository',
    private: false,
    url: 'https://github.com/Zafarebad/test-ai-review',
    defaultBranch: 'main',
  },
  {
    id: 'repo-2',
    fullName: 'Zafarebad/ai-code-review',
    name: 'ai-code-review',
    owner: 'Zafarebad',
    description: 'AI Code Review Platform source code',
    private: false,
    url: 'https://github.com/Zafarebad/ai-code-review',
    defaultBranch: 'main',
  },
];

export const MOCK_BRANCHES: Record<string, Branch[]> = {
  'Zafarebad/test-ai-review': [
    { name: 'main', sha: 'a1b2c3d4e5f6', protected: true },
    { name: 'develop', sha: 'b2c3d4e5f6a1', protected: false },
    { name: 'feat/brevo', sha: 'c3d4e5f6a1b2', protected: false },
    { name: 'feat/login', sha: 'd4e5f6a1b2c3', protected: false },
    { name: 'fix/ui', sha: 'e5f6a1b2c3d4', protected: false },
    { name: 'fix/auth-bug', sha: 'f6a1b2c3d4e5', protected: false },
  ],
  'Zafarebad/ai-code-review': [
    { name: 'main', sha: 'f6a1b2c3d4e5', protected: true },
    { name: 'feat/ai-code-review-app', sha: 'a1b2c3d4e5f6', protected: false },
    { name: 'feat/dashboard-ui', sha: 'b2c3d4e5f601', protected: false },
  ],
};

/** Fallback branches if repository is not in the mock map */
export const DEFAULT_BRANCHES: Branch[] = [
  { name: 'main', sha: '000000000000', protected: true },
  { name: 'develop', sha: '111111111111', protected: false },
];
