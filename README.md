# AI Code Review Platform

> A production-grade, security-hardened Next.js 15 developer portal that coordinates AI-assisted pull request reviews across GitHub, Claude 3.5 Sonnet, and Telegram via an automated n8n engine.

---

## 🌟 Overview

The **AI Code Review Platform** transforms automated code analysis into a frictionless, self-service developer tool. Developers select a target repository and branch pair, configure options, and trigger an end-to-end pull request review workflow.

### Key Capabilities
- **Automated PR Detection & Creation**: Checks for existing open PRs between branches; creates one automatically if none exists.
- **AI-Powered Code Review**: Integrates Anthropic Claude to inspect diffs and generate structured reviews (summaries, critical findings, performance issues, security advisories).
- **Automated GitHub Comments**: Automatically publishes AI review results as PR comments.
- **Multi-Channel Notifications**: Real-time Telegram alerting with direct links to the pull request.
- **Zero-Secret Client Architecture**: Tokens (GitHub, Anthropic, Telegram) reside strictly inside the n8n credential vault — never exposed to client browsers.
- **Built-in Mock Simulation Mode**: Instant testing out-of-the-box without requiring live n8n or GitHub setup.

---

## 📐 Architecture

```
┌────────────────────────────────────────────────────────┐
│                   Next.js 15 Client                    │
│      React 19 • Tailwind CSS • Lucide • TypeScript     │
└───────────────────────────┬────────────────────────────┘
                            │ POST /api/review
                            ▼
┌────────────────────────────────────────────────────────┐
│               Next.js Server API Route                 │
│        Input Validation • Error Normalization          │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP POST (N8N_WEBHOOK_URL)
                            ▼
┌────────────────────────────────────────────────────────┐
│            n8n Automation Engine (Webhook)             │
│                                                        │
│  1. Validate Input (Code Node)                         │
│  2. Query GitHub: Existing Open PR?                    │
│     ├── Yes: Re-use Existing PR Number                 │
│     └── No:  Create New Pull Request                   │
│  3. Fetch Changed Files & Generate Truncated Diff      │
│  4. Claude 3.5 Sonnet: Deep Code Review                │
│  5. GitHub API: Post Review Comment to PR              │
│  6. Telegram Bot: Broadcast Alert                      │
│  7. Return Unified JSON Response                       │
└────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: v18.18+ or v20+
- **npm**: v9+
- *(Optional)* A running instance of [n8n](https://n8n.io) (v1.0+)

### 2. Clone & Install
```bash
git clone https://github.com/Zafarebad/ai-code-review.git
cd ai-code-review
npm install
```

### 3. Configure Environment
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

```env
# Optional: Set this to connect to your live n8n workflow.
# If omitted or left empty, the application runs in Mock Simulation Mode!
N8N_WEBHOOK_URL=https://n8n.yourdomain.com/webhook/ai-code-review
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The root route will redirect you directly to the interactive dashboard.

---

## 🛠️ n8n Workflow Setup

A pre-built workflow JSON template is provided in `docs/n8n-webhook-workflow.json`.

### Step-by-Step Import:
1. Open your **n8n Web UI**.
2. Click **Add Workflow** ➔ **Import from File...**
3. Select `docs/n8n-webhook-workflow.json`.
4. Configure Credentials:
   - **GitHub Credential**: Personal Access Token (PAT) with `repo` scope.
   - **Claude/Anthropic Credential**: Anthropic API Key.
   - **Telegram Credential**: Telegram Bot Token and Chat ID.
5. In the **Webhook** node, copy the **Production URL** (or Test URL).
6. Save and **Activate** the workflow.
7. Paste the Webhook URL into `.env.local` as `N8N_WEBHOOK_URL`.

---

## 🛡️ Security Architecture

| Boundary | Data Flow & Security Guarantee |
|---|---|
| **Client Browser** | Submits branch choices and review flags. Never receives or stores API tokens. |
| **Next.js Server API** | Validates payloads and acts as a secure reverse proxy to the private n8n webhook. |
| **n8n Credentials Vault** | Securely stores `GITHUB_TOKEN`, `ANTHROPIC_API_KEY`, and `TELEGRAM_BOT_TOKEN` in encrypted storage at rest. |

---

## 🧪 Testing & Verification

### TypeScript & Lint Verification
```bash
# Type check all files without emitting JS
npx tsc --noEmit

# Run Next.js ESLint rules
npm run lint

# Build production bundle
npm run build
```

### Testing Scenarios
1. **Mock Simulation Mode (Default)**:
   - Leave `N8N_WEBHOOK_URL` empty in `.env.local`.
   - Select repository `Zafarebad/test-ai-review`.
   - Select Source `feat/brevo` and Target `main`.
   - Click **Run Review**. The UI simulates latency and returns existing PR #24 with review links.
2. **Validation Safeguard**:
   - Select `main` as both Source and Target branch.
   - The form immediately flags an inline validation error preventing duplicate-branch PR creation.

---

## 📂 Project Structure

```
ai-code-review/
├── .env.example                  # Environment configuration template
├── docs/
│   └── n8n-webhook-workflow.json # Importable n8n workflow definition
├── src/
│   ├── app/                      # Next.js 15 App Router
│   │   ├── api/                  # Server API endpoints (/review, /repositories, /branches)
│   │   ├── dashboard/            # Interactive dashboard page
│   │   ├── repositories/         # Repositories status view
│   │   ├── pull-requests/        # Pull request directory
│   │   ├── review-history/       # Past reviews audit log
│   │   ├── settings/             # System health & env documentation
│   │   ├── globals.css           # Global tokens & Tailwind styles
│   │   └── layout.tsx            # Global layout with AppShell
│   ├── components/
│   │   ├── dashboard/            # Review form, progress steps, PR result cards
│   │   ├── layout/               # AppShell, Sidebar, Header
│   │   └── ui/                   # Button, Card, Select, Badge, Spinner, Alert
│   ├── config/                   # Mock repositories and branch data
│   ├── lib/                      # Server-side n8n & GitHub services
│   └── types/                    # Shared TypeScript interfaces
```

---

## 📄 License
MIT License. Built for seamless developer workflows and automated code excellence.
AI Code Review flow test