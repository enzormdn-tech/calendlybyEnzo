---
phase: "03"
plan: "01"
subsystem: google-calendar-integration
tags: [google-calendar, oauth2, freebusy, api-routes, availability]
dependency_graph:
  requires: [availability-engine, drizzle-orm, turso]
  provides: [google-calendar-client, slots-api, book-api, availability-config]
  affects: [booking-flow, slot-picker]
tech_stack:
  added: [googleapis]
  patterns: [oauth2-refresh-token, freebusy-query, race-condition-guard]
key_files:
  created:
    - src/lib/google-calendar/client.ts
    - src/lib/google-calendar/index.ts
    - src/lib/availability/config.ts
    - src/app/api/slots/route.ts
    - src/app/api/book/route.ts
    - scripts/get-refresh-token.ts
  modified:
    - .env.example
    - package.json
    - package-lock.json
decisions:
  - OAuth2 refresh token stored in env vars (single-user app, Enzo only)
  - FreeBusy API for availability checks (not events.list) to avoid private data leakage
  - Race condition guard re-checks FreeBusy before creating event in POST /api/book
  - Default availability config hardcoded (Tue/Thu 14:00-18:00) until Phase 8 dashboard
  - Build script changed from turbopack to webpack due to @libsql LICENSE file parsing bug
metrics:
  duration: "4min"
  completed: "2026-04-05"
  tasks: 9
  files: 9
---

# Phase 3 Plan 1: Google Calendar Integration Summary

**One-liner:** Google Calendar OAuth2 client with FreeBusy availability queries, event creation, and two API routes (GET /api/slots, POST /api/book with race condition guard).

## What Was Built

### Google Calendar Client (`src/lib/google-calendar/client.ts`)
- OAuth2 client initialized from env vars (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN)
- Singleton pattern for calendar client (reused across cold starts)
- Configurable calendar ID with "primary" default

### Google Calendar Operations (`src/lib/google-calendar/index.ts`)
- `getFreeBusyPeriods(startDate, endDate)` -- queries FreeBusy API, returns BusyPeriod[] compatible with availability engine
- `createBookingEvent(prospect, startTime, endTime)` -- creates calendar event with prospect name/email in summary and description

### Default Availability Config (`src/lib/availability/config.ts`)
- Tuesday and Thursday, 14:00-18:00 Europe/Paris
- 30-minute slots, 15-minute buffer, 24h min notice, 14-day max future

### GET /api/slots (`src/app/api/slots/route.ts`)
- Fetches real busy periods from Google Calendar for next 2 weeks
- Runs availability engine with DEFAULT_CONFIG + busy periods
- Returns JSON array of available slots
- Graceful error handling (503 for auth issues, 500 for other failures)

### POST /api/book (`src/app/api/book/route.ts`)
- Accepts { name, email, startTime, endTime } validated with Zod
- Race condition guard: re-checks FreeBusy for the exact slot before creating event
- If conflict detected: returns 409 with clear message
- On success: creates Google Calendar event + stores booking in Turso DB
- Returns 201 with booking confirmation (eventId, htmlLink)

### OAuth Setup Script (`scripts/get-refresh-token.ts`)
- One-time script Enzo runs to get his refresh token
- Opens browser for consent, starts local server for callback
- Prints refresh token to copy into .env
- Requests minimal scopes: calendar.freebusy + calendar.events

## Commits

| Hash | Message |
|------|---------|
| e31e26c | feat(03-01): Google Calendar integration with slots and booking APIs |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Turbopack build failure with @libsql LICENSE file**
- **Found during:** Task 9 (build verification)
- **Issue:** Turbopack parses `node_modules/@libsql/hrana-client/LICENSE` as JavaScript, causing a syntax error. This is a known Turbopack bug with non-JS files in node_modules.
- **Fix:** Changed `package.json` build script from `next build --turbopack` to `next build` (uses webpack, which handles this correctly). Dev mode still uses turbopack.
- **Files modified:** package.json
- **Commit:** e31e26c

## Known Stubs

None -- all functionality is fully wired. The API routes are operational once Google OAuth credentials are configured in environment variables.

## Verification

- Build passes: `npm run build` completes successfully with both API routes registered as dynamic server-rendered
- All 14 existing tests pass (availability engine tests unaffected)
- API routes correctly listed in build output: `/api/book` (dynamic), `/api/slots` (dynamic)

## Self-Check: PASSED

All 7 created/modified files verified on disk. Commit e31e26c verified in git log.
