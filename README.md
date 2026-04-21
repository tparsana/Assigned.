# Assigned

Assigned is Samaya's internal task management and assignment platform. This codebase is being refactored from a personal-planning app into a collaborative operations workspace with Supabase for authentication and backend services.

## Stack

- Next.js 16
- React 19
- Supabase Auth + Postgres
- Tailwind CSS 4

## Local Setup

1. Copy `.env.example` to `.env.local`.
2. Fill in the Supabase values for your current project.
3. Run `npm install`.
4. Run `npm run dev`.

## Environment Variables

Required variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SITE_URL`

Optional server/admin variables:

- `SUPABASE_SERVICE_ROLE_KEY`
- `ASSIGNED_SUPABASE_SERVICE_ROLE_KEY`
- `ASSIGNED_ADMIN_ACCESS_CODE`

Assigned-scoped Supabase aliases are still accepted as fallbacks during the transition.

## Supabase Auth Setup

- Email/password auth is handled through the Supabase client/server helpers in `lib/supabase`.
- Google sign-in is triggered with `supabase.auth.signInWithOAuth({ provider: "google" })`.
- In Supabase Auth provider settings, configure Google and add redirect URLs that include:
  - `http://localhost:3000/auth/confirm`
  - your production `https://.../auth/confirm` URL

## Supabase Notes

- Existing databases should be upgraded with:
  - [supabase/migrations/20260328_assigned_user_states.sql](/Users/tanishparsana/Downloads/Projects/Assigned./supabase/migrations/20260328_assigned_user_states.sql)
  - [supabase/migrations/20260419_assigned_access_foundation.sql](/Users/tanishparsana/Downloads/Projects/Assigned./supabase/migrations/20260419_assigned_access_foundation.sql)
  - [supabase/migrations/20260420_assigned_org_access_restructure.sql](/Users/tanishparsana/Downloads/Projects/Assigned./supabase/migrations/20260420_assigned_org_access_restructure.sql)
- If you're setting this up directly in the Supabase dashboard, paste [supabase/sql/assigned-bootstrap.sql](/Users/tanishparsana/Downloads/Projects/Assigned./supabase/sql/assigned-bootstrap.sql) into the SQL Editor and run it once.
- The middleware/proxy refreshes Supabase sessions so server components can rely on `supabase.auth.getUser()`.
- The initial database now includes:
  - `public.assigned_organizations`
  - `public.assigned_user_profiles`
  - `public.assigned_memberships`
  - `public.assigned_teams`
  - `public.assigned_positions`
  - `public.assigned_access_level_permissions`
  - `public.assigned_user_states`
- New users are created as `employee` by default during auth onboarding. Team, position, project assignment, and promotion are handled later by admins.
- The hidden admin bootstrap path only works while the organization has zero admins. It calls the backend RPC `assigned_claim_bootstrap_admin`.
- `SUPABASE_SERVICE_ROLE_KEY` is required for server-side team management, invitations, and admin bootstrap.

## Current Direction

This version focuses on:

- rebranding Tasked into Assigned
- running authentication and backend access through Supabase
- keeping components easier to reuse as the Samaya-specific product evolves
- preserving room to expand into a more generic multi-company SaaS later
