# CodeNeuron

Real-time collaborative code review with AI-powered analysis. Paste or upload code, run the AI analyzer (Anthropic Claude), and review with teammates in real time — live cursors, line comments, and team voting on AI findings.

## Features

- Paste or upload a code snippet in any of 17 languages
- Split-screen review UI: code on the left, AI analysis + comments on the right
- AI analysis via Anthropic Claude: security, performance, best-practice, and refactoring findings (with a built-in heuristic analyzer as a zero-config fallback)
- Real-time collaboration: presence avatars, live cursor tracking, and live comments via Supabase Realtime
- Vote on AI findings (upvote/downvote), persisted per session
- Export a review session as JSON
- Dark mode, syntax highlighting, responsive layout

## Tech stack

- Next.js 14 (App Router) + React + TypeScript
- Tailwind CSS
- `prism-react-renderer` for syntax highlighting
- Supabase (PostgreSQL + Realtime) for persistence and collaboration
- Anthropic Claude API for code analysis
- Deployable to Vercel

## Getting started

```bash
npm install
cp .env.example .env.local   # add your keys
npm run dev
```

Open http://localhost:3000, create a session, and share the review link.

### Without any keys

The app runs fully in single-user mode with zero configuration:

- Analysis uses a built-in heuristic analyzer that detects common issues (`eval()`, hardcoded secrets, `innerHTML`, `console.log`, TODO markers, sequential I/O, etc.)
- Sessions and comments are stored in-memory for the lifetime of the server process
- To get real-time collaboration and persistence across serverless cold starts, add Supabase keys

## Configuration

| Env var | Required | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | for Claude analysis | Enables real AI analysis. Without it, the heuristic analyzer runs. |
| `NEXT_PUBLIC_SUPABASE_URL` | for collaboration | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | for collaboration | Supabase anon key |

### Supabase setup

1. Create a project at https://supabase.com
2. Run `supabase/schema.sql` in the SQL editor
3. Copy `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` into `.env.local`

With Supabase configured, sessions and comments persist in PostgreSQL and real-time presence/cursors/comments sync across all connected reviewers.

## Project structure

```
app/
  page.tsx                  # Home: create a review session
  review/[id]/page.tsx      # Review workspace (editor + panels)
  api/
    sessions/               # POST create session
    sessions/[id]/          # GET / PATCH a session
    sessions/[id]/comments/ # GET / POST line comments
    analyze/                # POST run AI analysis
components/
  CodeEditor.tsx            # Syntax-highlighted editor + cursors + line gutter
  AIPanel.tsx               # AI findings + voting
  CommentsPanel.tsx         # Line comments
  PresenceBar.tsx           # Live user avatars
  ShareDialog.tsx           # Share link + JSON export
  VoteButton.tsx
hooks/
  useRealtimeSession.ts     # Presence, cursors, comment sync (Supabase Realtime)
  useUser.ts                # Local reviewer identity
  useVotes.ts               # Per-session vote persistence
lib/
  claude.ts                 # Claude API integration + heuristic fallback
  store.ts                  # Persistence (memory + Supabase)
  supabase.ts               # Supabase client
  types.ts                  # Shared types
```

## Deploy to Vercel

```bash
# push to GitHub, then import the repo at https://vercel.com/new
# add the env vars above in Project Settings → Environment Variables
```

Note: real-time collaboration relies on Supabase Realtime (external), so it works on Vercel's serverless functions. In-memory sessions work per-instance; enable Supabase for durable shared sessions.
