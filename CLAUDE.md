# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Production build
npm run start    # Run production build
npm run lint     # ESLint
```

No test suite is configured.

## Environment Variables

Required in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
INSTAGRAM_APP_ID=
INSTAGRAM_APP_SECRET=
BASE_URL=                      # Optional; falls back to req.nextUrl.origin
```

## Project Philosophy

This is a clean MVP Instagram automation app. Act like a pragmatic engineer — keep things simple and ship.

- Do not over-engineer or introduce complex patterns
- Do not change the folder structure unless explicitly asked
- Prefer simple session checks and straightforward API routes
- Focus on UX clarity and minimal safe logic

**User flow:**
1. Not logged in → redirect to `/login`
2. Logged in, no Instagram connected → show "Connect Instagram"
3. Logged in + Instagram connected → show dashboard

## Architecture

**Instagram Automation SaaS** built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, and Supabase for auth + database.

### Auth Flow

1. **App auth**: Supabase email/password via `/login` page (`app/login/page.tsx`). The browser client stores the session; the access token is passed as a `Bearer` header to all protected API routes.

2. **Instagram OAuth (two-step)**:
   - `POST /api/auth/login` — generates a CSRF state, stores it plus the user ID in httpOnly cookies (10-min TTL), returns the Instagram OAuth URL.
   - `GET /api/auth/callback` — validates state cookie, exchanges the code for a short-lived then long-lived Instagram token (~60 days), fetches the IG profile, and inserts a row into the `accounts` table using `supabaseAdmin` (bypasses RLS).

3. **Route protection**: `requireAuth()` in `lib/auth.ts` validates the Bearer token against Supabase and returns `{ ok, userId, accessToken }`. Every protected API route calls this first.

### Supabase Client Pattern

Three separate clients serve distinct purposes — **do not mix them up**:

| File | Export | Purpose |
|------|--------|---------|
| `lib/supabaseAdmin.ts` | `supabaseAdmin` | Service role, server-only (`"server-only"` import), bypasses RLS. Use only when RLS must be bypassed (e.g., OAuth callback). |
| `lib/supabaseServer.ts` | `getSupabaseServerClient()` | Anon key, no session — used to validate tokens in `requireAuth`. |
| `lib/supabaseServer.ts` | `getSupabaseServerClientWithAuth(accessToken)` | Anon key with user's Bearer token injected — enforces RLS for user-scoped queries. |
| `lib/supabaseClient.ts` | `getSupabaseBrowserClient()` | Singleton browser client — used in `"use client"` components to manage Supabase auth sessions. |

### Database Tables

- **`workspaces`**: `user_id`, `instagram_user_id`, `username`, `access_token`, `token_expires_at`, `is_ai_configured`, `onboarding_answers`, `demo_mode`, `ai_status`
- **`automation_settings`**: `user_id`, `dm_active`, `comments_active`
- **`stats`**: `user_id`, `dms_handled`, `comments_replied`, `response_rate`

Automation routes (`/api/automation/dm`, `/api/automation/comments`) use an upsert pattern: try `UPDATE` first, fall back to `INSERT` if no rows were matched.

### Styling Convention

Mixed approach: `app/page.tsx` uses inline `React.CSSProperties` objects; `app/dashboard/page.tsx` uses CSS Modules (`dashboard.module.css`). Tailwind is available globally.
