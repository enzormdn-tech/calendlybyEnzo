# Phase 2: Availability Engine - Context

**Gathered:** 2026-04-06
**Status:** Ready for planning
**Mode:** Auto-generated (autonomous mode)

<domain>
## Phase Boundary

A tested, reliable slot computation engine that accepts availability config + busy periods and returns available 30-minute time slots. Pure function — no external API calls. Europe/Paris timezone, DST-aware.

</domain>

<decisions>
## Implementation Decisions

### Slot Computation
- Slots are 30 minutes fixed (discovery call duration)
- 15-minute buffer between bookings enforced
- Minimum scheduling notice: 24 hours
- Maximum future booking window: 2 weeks
- Timezone: Europe/Paris (hardcoded, no prospect timezone detection needed)
- DST transitions must be handled correctly (March/October)

### Data Structures
- Availability windows: array of { dayOfWeek, startTime, endTime } (e.g., Tue 14:00-18:00)
- Busy periods: array of { start: ISO8601, end: ISO8601 } (from Google Calendar FreeBusy)
- Output: array of { start: ISO8601, end: ISO8601 } available slots

### Testing
- Unit tests with date-fns for the pure computation function
- Test cases: normal day, DST transition, fully booked day, buffer overlap, min notice, max window

### Claude's Discretion
- Internal function signatures and module organization
- Choice of test framework (vitest recommended per stack research)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- date-fns and date-fns-tz already installed (Phase 1)
- zod already installed for validation

### Established Patterns
- src/ directory structure with app/ and db/ subdirectories
- TypeScript throughout

### Integration Points
- This engine will be called by API routes in Phase 3 (Google Calendar integration)
- Availability config will come from database (Phase 8) — for now, use hardcoded config

</code_context>

<specifics>
## Specific Ideas

- Engine should be a pure function: getAvailableSlots(config, busyPeriods, now) => Slot[]
- Keep it in src/lib/availability/ for clean separation
- Config type should be defined with zod for validation

</specifics>

<deferred>
## Deferred Ideas

None — core algorithm phase.

</deferred>
