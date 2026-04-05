# Project Research Summary

**Project:** CalendlyByEnzo — personal booking/scheduling page
**Domain:** Single-coach booking page for coaching discovery calls
**Researched:** 2026-04-05
**Confidence:** HIGH

## Executive Summary

CalendlyByEnzo is a personal scheduling page built to replace Calendly with a fully branded, zero-dependency alternative. Experts build this type of tool as a thin Next.js app on top of Google Calendar: Google Calendar IS the database (no separate DB needed), the server computes available slots from a static availability config minus Google FreeBusy results, and a simple booking flow collects name + email and writes a calendar event. The architecture is intentionally simple — a monolith is the correct choice at this scale. Every architectural decision in the research points toward minimal dependencies: no auth system, no separate bookings table, no real-time updates, no admin UI.

The recommended approach is a 5-phase build: availability engine first (pure function, no external deps), then Google Calendar integration, then the booking UI, then notifications, then polish. This ordering is validated by the dependency chain in the architecture research — the slot computation engine can be built and tested in isolation before touching any external API. The Google Calendar refresh token must be set up in "production" mode from day one (not "testing"), as tokens in testing mode expire after 7 days and silently break availability.

The top risks are well-understood and preventable: race condition double-bookings (mitigated by a server-side re-check before event creation), timezone bugs (mitigated by storing all times as ISO 8601 UTC and converting at display time), and OAuth token expiry (mitigated by moving to production publishing status and adding a Telegram health alert). All three must be addressed in the core booking logic phase, not bolted on later. Email deliverability (SPF/DKIM/DMARC setup) is a one-time configuration task that must happen before the first real email is sent.

## Key Findings

### Recommended Stack

Next.js 15 with App Router is the unambiguous choice: API routes and React components in a single project, zero-config Vercel deployment. Turso (cloud SQLite) with Drizzle ORM is preferred over Vercel Postgres because the schema is tiny (3-4 tables at most) and Turso's free tier is generous — but the architecture research actually recommends skipping a database entirely and using Google Calendar as the sole data store, which eliminates the need for Turso in v1. Resend handles transactional email with native React Email integration. Telegram notifications use a raw `fetch()` to the Bot API — no library needed.

**Core technologies:**
- **Next.js 15 + TypeScript:** Full-stack framework with App Router — API routes + React Server Components in one project, Vercel deploy
- **Tailwind CSS 4:** Styling — fast iteration on Enzo's dark theme (`#0f0f0f`, Inter font)
- **Google Calendar API (googleapis):** FreeBusy for availability checks, Events for booking creation — source of truth
- **Resend + React Email:** Transactional email (confirmation + .ics attachment) — best DX for Next.js, 100 emails/day free
- **date-fns + date-fns-tz:** Date manipulation and timezone conversion — tree-shakeable, DST-aware
- **Zod:** Server-side input validation on booking form
- **Telegram Bot API (raw fetch):** Instant booking notification to Enzo — no library needed

**What NOT to use:** better-sqlite3 (fails on Vercel serverless), Prisma (overweight for this schema), NextAuth (no auth needed), SendGrid (free plan retired May 2025), Moment.js (deprecated).

### Expected Features

The MVP feature set is well-defined and compact. Everything a prospect expects from a booking page is achievable without a database — the Google Calendar integration covers all state management.

**Must have (table stakes — v1):**
- Available slot display with Google Calendar conflict avoidance
- Timezone detection and display (auto-detect, show "heure de Paris" label always)
- Booking form (name + email only — no account creation)
- Google Calendar event creation on booking
- Confirmation screen with full booking details
- Confirmation email with .ics calendar attachment
- Mobile-responsive dark theme matching Enzo's brand
- Readiness checklist gate (pre-qualifies prospects before showing slots)

**Should have (differentiators — v1 or v1.x):**
- Telegram notification to Enzo on new booking
- Buffer time between meetings (15min default)
- Minimum scheduling notice (24h) and maximum booking window (2-3 weeks)
- Reminder email 24h before the call

**Defer (v2+):**
- Multiple event types (only if paid sessions are added)
- Prospect rescheduling via magic link (only if volume warrants it)
- Payment integration (Stripe — only when paid sessions exist)
- SMS reminders

**Anti-features to avoid:** multiple event types in v1, prospect-initiated rescheduling, full intake forms, real-time slot polling, account creation for prospects.

### Architecture Approach

The architecture is a monolith with clear layer separation: Next.js App Router handles routing and UI, API routes (`/api/slots` and `/api/book`) handle all server logic, a services layer contains the availability engine and booking service, and external services (Google Calendar, Telegram, Resend) are wrapped in thin adapters. The key insight is that Google Calendar is both the availability source and the booking record — no database sync issues are possible. All slot computation happens server-side; the client receives a flat list of ISO 8601 timestamps and formats them for display only.

**Major components:**
1. **Availability Engine** (`lib/availability/engine.ts`) — pure function: config + busy periods → available slots. No external deps, fully testable in isolation.
2. **Google Calendar Client** (`lib/google-calendar/`) — thin wrappers around FreeBusy query and Events insert. Auth via stored refresh token.
3. **Booking Service** (`lib/`) — validates input, double-checks conflicts, creates event, fires parallel notifications.
4. **Notification Layer** (`lib/notifications/`) — Telegram and Resend adapters, fire-and-forget (booking succeeds even if Telegram is down).
5. **Booking Flow UI** (`components/`) — 4 sequential components: readiness checklist → date picker → time slots → booking form.

### Critical Pitfalls

1. **Race condition double-booking** — Re-check Google Calendar for conflicts immediately before creating the event (not just when displaying slots). At Enzo's scale, an optimistic create + verify approach works: create event, then re-query FreeBusy for that slot, delete and return 409 if overlap detected.

2. **OAuth token expiring silently** — Move Google Cloud project to "production" publishing status before launch (testing mode tokens expire in 7 days). Add a health-check endpoint that tests Calendar connectivity. Alert Enzo via Telegram when the token fails.

3. **Timezone display causing wrong bookings** — Store all times as ISO 8601 UTC. Generate slots server-side with explicit Europe/Paris timezone. Always show timezone label in UI. Use `date-fns-tz` with IANA timezone names (never "CET"/"CEST" abbreviations). Test around DST transition dates (late March and late October).

4. **Confirmation email landing in spam** — Configure SPF, DKIM, and DMARC on sending domain before sending the first email. Use Resend with a verified custom subdomain. Test with mail-tester.com (target 9+/10) before launch.

5. **Wrong Google Calendar API endpoint** — Use `freebusy.query` for availability checks (returns only busy intervals, no event details). Reserve `calendar.events` scope only for creating the booking. Never pass raw event data to the frontend.

## Implications for Roadmap

Based on research, the dependency chain is clear and suggests a 5-phase build:

### Phase 1: Availability Engine (Core Algorithm)
**Rationale:** The availability engine is a pure function with no external dependencies. It can be built and fully tested with mock data before any API credentials exist. Everything else depends on it working correctly.
**Delivers:** A tested, reliable slot computation engine that accepts availability config + busy periods and returns available time slots with buffer, min notice, and max window applied.
**Addresses:** Slot display, buffer time, min notice, max booking window (FEATURES.md table stakes)
**Avoids:** Timezone bugs (all time logic must be correct from day one — see Pitfall 3), buffer missing from slot generation (Pitfall 6)
**Research flag:** Standard patterns, well-documented — no additional research phase needed.

### Phase 2: Google Calendar Integration
**Rationale:** Second because it wires the engine to real data. OAuth setup, FreeBusy queries, and event creation are all well-documented. This phase has the most external dependencies and the most critical pitfalls.
**Delivers:** Live availability from Enzo's Google Calendar. Booking creates a real calendar event. One-time OAuth refresh token stored in env vars.
**Uses:** `googleapis` package, stored refresh token auth pattern (STACK.md)
**Implements:** Google Calendar Client component (ARCHITECTURE.md)
**Avoids:** OAuth token expiry (must configure production publishing status), wrong API endpoint (must use FreeBusy not Events.list), privacy leaks (Pitfall 5)
**Research flag:** OAuth setup and FreeBusy integration have existing community examples (architecture sources). No additional research phase needed, but the "production mode" gotcha must be in the verification checklist.

### Phase 3: Booking Flow UI
**Rationale:** Third because it requires Phases 1 + 2 to supply real slot data. The 4-component sequential flow (checklist → date → time → form) is standard progressive disclosure. Dark theme and mobile-first are already Enzo's design system.
**Delivers:** A complete, branded booking experience. Prospect can load the page, pass the readiness checklist, pick a slot, and submit their name + email.
**Addresses:** All table stakes UX features (FEATURES.md): slot display, timezone-aware times, readiness checklist, booking form, confirmation screen
**Avoids:** Client-side slot generation (Anti-Pattern 1), empty week shown to prospect (UX Pitfalls), tiny tap targets on mobile
**Research flag:** Standard Next.js App Router patterns — no additional research phase needed.

### Phase 4: Notifications
**Rationale:** Independent of the UI — can be added directly to `/api/book`. Telegram and email are thin adapters. This phase also includes the double-check conflict guard in `/api/book` (the race condition mitigation).
**Delivers:** Prospect receives confirmation email with .ics attachment. Enzo gets instant Telegram notification. Race condition on booking submission is eliminated.
**Uses:** Resend + React Email, Telegram Bot API raw fetch (STACK.md), double-check pattern (ARCHITECTURE.md Pattern 3)
**Avoids:** Race condition double-booking (Pitfall 1), email in spam (Pitfall 4 — requires DNS setup before this phase goes live), Telegram failure blocking booking (must be fire-and-forget)
**Research flag:** Resend integration is well-documented. SPF/DKIM/DMARC setup is a one-time DNS task — no research phase needed, but must be in the launch checklist.

### Phase 5: Polish + Reminders
**Rationale:** Last because it depends on stable email infrastructure from Phase 4 and real usage data to validate that reminders are needed. Includes all the "looks done but isn't" verification items.
**Delivers:** Reminder email 24h before call (Vercel Cron), error states for all edge cases, timezone display polish, OAuth health check with Telegram alerting, mobile UX refinements.
**Addresses:** Reminder email (FEATURES.md v1.x), conflict-on-submit handling, stale availability graceful error
**Avoids:** Stale availability ghost slot (Pitfall 7), OAuth expiry going unnoticed (Pitfall 2)
**Research flag:** Vercel Cron is well-documented for Next.js. Standard patterns — no additional research phase needed.

### Phase Ordering Rationale

- The availability engine must come first: it is the core algorithm with no external deps. Testing it in isolation prevents timezone bugs from being introduced with the complexity of API integration.
- Google Calendar integration second: the engine + calendar integration together form a complete data pipeline that can be validated (via a JSON endpoint) before any UI exists.
- UI third: building UI against real data from day one prevents the classic trap of building a polished interface and then discovering the slot data is wrong.
- Notifications fourth: booking must work end-to-end before adding side effects. Fire-and-forget notifications must not be able to break the booking flow.
- Polish last: UX refinements and reminders depend on the happy path being solid. The reminder cron depends on stable email.

### Research Flags

Phases likely needing deeper research during planning:
- **None identified.** The architecture is well-documented with existing reference implementations (Andrii Furmanets walkthrough, Tim Feeley DEV tutorial). All integration patterns (FreeBusy API, OAuth refresh token, Resend, Telegram) have clear documentation.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Availability Engine):** Pure TypeScript, no external APIs — standard date math patterns.
- **Phase 2 (Google Calendar):** Official Google docs + existing Next.js tutorials cover this exactly.
- **Phase 3 (Booking UI):** Standard Next.js App Router + Tailwind component patterns.
- **Phase 4 (Notifications):** Resend and Telegram have clear getting-started docs.
- **Phase 5 (Polish):** Vercel Cron is documented. DNS setup is operational, not technical.

**One operational prerequisite:** Google Cloud project setup (enable Calendar API, create OAuth credentials, do the one-time auth to get a refresh token) must happen before Phase 2 begins. This requires Enzo's manual action — it cannot be scripted.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All technologies verified against official docs and npm. better-sqlite3 incompatibility confirmed by Vercel KB. SendGrid retirement confirmed. |
| Features | HIGH | Competitor analysis against Calendly, Cal.com, TidyCal, SavvyCal. Feature set is small and well-defined. |
| Architecture | HIGH | Two independent reference implementations found (Furmanets, Feeley) that validate the Google Calendar as database approach for this exact use case. |
| Pitfalls | HIGH | Race condition, OAuth expiry, and timezone bugs are documented failure modes from production systems. Email deliverability patterns are standard. |

**Overall confidence:** HIGH

### Gaps to Address

- **Race condition mitigation implementation detail:** The optimistic create + verify approach is the right call at Enzo's scale, but the exact implementation (how long to hold a slot, whether to delete the conflicting event or return early) should be decided during Phase 4 planning. No gap in understanding the problem — just an implementation choice.
- **Google Cloud project status:** The research confirms tokens expire in testing mode after 7 days, but whether Enzo's existing Google Cloud project (if any) is already in production mode is unknown. Must be verified before Phase 2 work begins.
- **Sending domain for Resend:** The research recommends a subdomain like `mail.enzo-domain.com`. Enzo's primary domain for this project is not specified in the research. Must be confirmed before Phase 4 to allow time for DNS propagation.

## Sources

### Primary (HIGH confidence)
- [Next.js Blog](https://nextjs.org/blog) — v15 LTS status, v16 timeline
- [Vercel SQLite KB](https://vercel.com/kb/guide/is-sqlite-supported-in-vercel) — better-sqlite3 incompatibility confirmed
- [Turso + Drizzle Docs](https://docs.turso.tech/sdk/ts/orm/drizzle) — integration guide
- [Google Calendar FreeBusy API Reference](https://developers.google.com/workspace/calendar/api/v3/reference/freebusy/query) — availability checking
- [Google Calendar API Overview](https://developers.google.com/workspace/calendar/api/guides/overview) — authentication methods
- [Google OAuth2 Documentation](https://developers.google.com/identity/protocols/oauth2) — token lifecycle, 50-token limit per client
- [Resend NPM](https://www.npmjs.com/package/resend) — v6.10.0
- [React Email](https://react.email) — v5.2.10

### Secondary (MEDIUM confidence)
- [How I Built My Own Meeting Booking System — Andrii Furmanets](https://andriifurmanets.com/blogs/build-your-own-booking-system-comprehensive-guide) — full Next.js + Google Calendar + Telegram walkthrough
- [Build Your Own Calendly-like Page with Next.js — Tim Feeley (DEV)](https://dev.to/timfee/build-and-host-your-own-calendy-like-scheduling-page-using-nextjs-and-google-apis-5ack) — slot generation algorithm
- [Silvermine AI — Booking System Using Google Calendar](https://www.silvermine.ai/newsletter/booking-system-using-google-calendar-where-it-works-and-where-it-breaks) — where Google Calendar as backend breaks
- [Debugging Real-Time Bookings (Medium)](https://medium.com/@get2vikasjha/debugging-real-time-bookings-fixing-hidden-race-conditions-cache-issues-and-double-bookings-98328bc52192) — race conditions
- [Postmark — Transactional Email Best Practices 2026](https://postmarkapp.com/guides/transactional-email-best-practices) — deliverability checklist
- [Fixing JavaScript Timezone Issues (Neon)](https://neon.com/blog/fixing-javascript-timezone-issues) — UTC storage patterns
- Competitor analysis: Calendly, Cal.com, TidyCal, SavvyCal feature pages

### Tertiary (MEDIUM-LOW confidence)
- [PkgPulse: date-fns vs Day.js vs Luxon 2026](https://www.pkgpulse.com/blog/best-javascript-date-libraries-2026) — timezone library comparison
- [Drizzle vs Prisma 2026](https://www.bytebase.com/blog/drizzle-vs-prisma/) — ORM comparison

---
*Research completed: 2026-04-05*
*Ready for roadmap: yes*
