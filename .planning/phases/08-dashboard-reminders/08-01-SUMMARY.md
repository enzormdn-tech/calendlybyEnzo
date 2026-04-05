---
phase: "08"
plan: "01"
subsystem: dashboard-reminders
tags: [dashboard, availability, cron, reminders, email, middleware, auth]
dependency_graph:
  requires: [bookings-schema, brevo-email, availability-engine]
  provides: [dashboard-ui, availability-crud, reminder-cron, dashboard-auth]
  affects: [slots-api, bookings-schema]
tech_stack:
  added: [vercel-cron]
  patterns: [middleware-auth, db-driven-config, fire-and-forget-email]
key_files:
  created:
    - src/app/dashboard/layout.tsx
    - src/app/dashboard/page.tsx
    - src/app/dashboard/availability/page.tsx
    - src/app/dashboard/login/page.tsx
    - src/app/api/availability/route.ts
    - src/app/api/availability/[id]/route.ts
    - src/app/api/cron/reminders/route.ts
    - src/middleware.ts
    - vercel.json
  modified:
    - src/db/schema.ts
    - src/app/api/slots/route.ts
    - .env.example
decisions:
  - Dark theme dashboard (#1c1c1c bg, #fafaf8 text) inverted from prospect page
  - Simple cookie-based password auth via middleware (no NextAuth overhead)
  - DB-driven availability with fallback to DEFAULT_CONFIG when no rows exist
  - Hourly Vercel Cron for reminders with CRON_SECRET bearer token verification
  - Brevo SMTP API reused for reminder emails with same visual style as confirmation
metrics:
  duration: 3min
  completed: "2026-04-05T22:48:00Z"
---

# Phase 8 Plan 1: Dashboard & Reminders Summary

**One-liner:** Admin dashboard with booking views, DB-driven availability CRUD, password-protected middleware, and 24h reminder emails via Vercel Cron + Brevo.

## What Was Built

### Database Schema Updates
- Added `availability_windows` table (id, dayOfWeek, startTime, endTime) for DB-driven config
- Added `reminded` boolean column to `bookings` table (default false) for cron tracking

### Dashboard (Dark Theme Admin)
- **Layout** (`/dashboard`): Dark bg #1c1c1c, nav with "Rendez-vous" and "Disponibilites" links
- **Bookings page**: Server component querying Turso for upcoming (ascending) and past (descending) bookings with French date formatting
- **Availability page**: Client component with CRUD — lists configured windows, add form (day/start/end), delete buttons
- **Login page**: Simple password input that sets `dashboard_auth` cookie

### API Routes
- `GET /api/availability` — list all windows
- `POST /api/availability` — add window with zod validation (day 0-6, HH:mm times, end > start)
- `DELETE /api/availability/[id]` — delete window by ID

### Middleware Authentication
- Protects all `/dashboard/*` routes except `/dashboard/login`
- Checks `dashboard_auth` cookie or `Authorization: Bearer` header against `DASHBOARD_PASSWORD` env var
- Redirects to login page if not authenticated
- Allows access if no password configured (dev convenience)

### Slots API Update
- `GET /api/slots` now reads availability windows from DB first
- Falls back to `DEFAULT_CONFIG` (Tue/Thu 14h-18h) if no DB windows exist
- Same Google Calendar integration, buffer, and notice rules apply

### Reminder Cron
- `GET /api/cron/reminders` triggered hourly by Vercel Cron
- Secured with `CRON_SECRET` bearer token
- Queries confirmed bookings within next 24h where `reminded = false`
- Sends reminder email via Brevo (same visual style as confirmation)
- Updates `reminded = true` after successful send
- Fire-and-forget: individual failures don't block other reminders

### Configuration
- `vercel.json` with hourly cron schedule (`0 * * * *`)
- `.env.example` updated with `DASHBOARD_PASSWORD` and `CRON_SECRET`

## Commits

| Hash | Message |
|------|---------|
| 39552f2 | feat(08-01): dashboard, availability management, and reminder cron |

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- Build passes: `npm run build` completes with 0 errors
- All routes registered: /dashboard, /dashboard/availability, /dashboard/login, /api/availability, /api/availability/[id], /api/cron/reminders
- Middleware registered at 34.2 kB
- Existing warnings (unused vars in DateChip.tsx, engine.test.ts) are pre-existing and out of scope

## Requirements Covered

| Requirement | Description | Status |
|-------------|-------------|--------|
| DASH-01 | Dashboard shows upcoming bookings | Complete |
| DASH-02 | Dashboard shows past bookings | Complete |
| DASH-03 | Dashboard allows configuring availability | Complete |
| AVAIL-01 | Enzo defines availability from dashboard | Complete |
| CONF-03 | Prospect receives 24h reminder email | Complete |
