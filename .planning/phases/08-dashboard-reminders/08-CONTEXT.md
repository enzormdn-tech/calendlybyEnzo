# Phase 8: Dashboard & Reminders - Context

**Gathered:** 2026-04-06
**Status:** Ready for planning
**Mode:** Auto-generated (autonomous mode)

<domain>
## Phase Boundary

Admin dashboard for Enzo (Enzo OS integration), availability window configuration, and automated reminder emails via Vercel Cron. The backend/admin side of the booking system.

</domain>

<decisions>
## Implementation Decisions

### Dashboard (Admin)
- Route: /dashboard (protected by simple env var check or basic auth)
- Show upcoming bookings (sorted by date, nearest first)
- Show past bookings (sorted by date, most recent first)
- Simple table/list view — no complex UI needed
- Data from Turso database (bookings table)

### Availability Configuration
- Route: /dashboard/availability or section within dashboard
- CRUD for availability windows: add/edit/delete
- Each window: day of week + start time + end time
- Save to Turso database (new availability_windows table)
- Replace hardcoded DEFAULT_CONFIG with database-driven config
- Update GET /api/slots to read config from DB

### Reminder Emails
- Vercel Cron job: runs every hour
- Checks for bookings happening in the next 24h that haven't been reminded yet
- Sends reminder email via Brevo with same style as confirmation
- Add "reminded" boolean flag to bookings table
- Cron route: /api/cron/reminders (protected with CRON_SECRET)

### Auth (Simple)
- No full auth system — just DASHBOARD_PASSWORD env var
- Simple middleware or check on /dashboard routes
- Good enough for single-user tool

### Claude's Discretion
- Dashboard layout and design
- Whether to use server components or client components for dashboard
- Cron schedule (every hour vs every 30 min)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- src/db/schema.ts — bookings table, extend with availability_windows
- src/db/index.ts — Drizzle client
- src/lib/notifications/email.ts — reuse for reminder emails
- src/lib/availability/config.ts — replace DEFAULT_CONFIG with DB query

### Integration Points
- Dashboard reads from Turso DB
- Availability config feeds into GET /api/slots
- Cron job uses existing email infrastructure
- vercel.json for cron configuration

</code_context>

<specifics>
## Specific Ideas

- Dashboard can use the dark theme since it's for Enzo only (not prospects)
- Keep it functional, not fancy — data visibility is the priority

</specifics>

<deferred>
## Deferred Ideas

None — this is the final phase.

</deferred>
