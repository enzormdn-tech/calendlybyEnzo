# Phase 3: Google Calendar Integration - Context

**Gathered:** 2026-04-06
**Status:** Ready for planning
**Mode:** Auto-generated (autonomous mode)

<domain>
## Phase Boundary

Wire the availability engine to Enzo's real Google Calendar. FreeBusy queries return real busy times, and booking events can be created programmatically. Two API routes: GET /api/slots (available slots) and POST /api/book (create calendar event).

</domain>

<decisions>
## Implementation Decisions

### Google Calendar Auth
- Use OAuth2 with stored refresh token (single-user app, Enzo only)
- Credentials stored in environment variables: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, GOOGLE_CALENDAR_ID
- No interactive OAuth flow needed in the app — Enzo does one-time auth manually to get refresh token
- Use googleapis npm package for Calendar API calls

### API Routes
- GET /api/slots — calls FreeBusy API with availability engine config, returns available slots as JSON
- POST /api/book — accepts { name, email, startTime, endTime }, creates Calendar event, stores booking in Turso DB
- Use freebusy.query (not events.list) for availability — more secure, no private event leakage

### Race Condition Prevention
- Before creating event in POST /api/book: re-check FreeBusy for the exact slot
- If conflict detected, return 409 with error message

### Claude's Discretion
- Google Calendar API wrapper module organization
- Error handling strategy for API failures
- Whether to create a one-time setup script for getting the refresh token

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- src/lib/availability/engine.ts — getAvailableSlots() pure function
- src/lib/availability/types.ts — AvailabilityConfig, BusyPeriod, Slot types
- src/db/schema.ts — bookings table already defined
- src/db/index.ts — Drizzle client ready

### Established Patterns
- TypeScript throughout, zod for validation
- Pure functions in src/lib/

### Integration Points
- API routes in src/app/api/
- Availability engine consumes BusyPeriod[] from Google Calendar
- Bookings stored in Turso via Drizzle

</code_context>

<specifics>
## Specific Ideas

- Keep Google Calendar wrapper in src/lib/google-calendar/
- Create a setup script (scripts/get-refresh-token.ts) that Enzo can run once to get his refresh token
- Default availability config hardcoded for now (Phase 8 adds dashboard config)

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>
