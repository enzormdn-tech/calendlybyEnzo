# Architecture Research

**Domain:** Personal booking/scheduling page
**Researched:** 2026-04-05
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js App Router)                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Readiness    │  │  Slot Picker  │  │  Booking     │          │
│  │  Checklist    │→ │  (date/time)  │→ │  Form        │          │
│  └──────────────┘  └──────┬───────┘  └──────┬───────┘          │
├────────────────────────────┼─────────────────┼──────────────────┤
│                     API Layer (Route Handlers)                   │
│  ┌──────────────┐  ┌──────┴───────┐  ┌──────┴───────┐          │
│  │ GET /api/     │  │ GET /api/    │  │ POST /api/   │          │
│  │ availability  │  │ slots        │  │ book         │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
├─────────┼─────────────────┼─────────────────┼───────────────────┤
│                     Services Layer                               │
│  ┌──────┴──────────────────┴───────┐  ┌─────┴────────────┐     │
│  │       Availability Engine        │  │  Booking Service  │     │
│  │  (config + Google Calendar)      │  │  (create + notify)│     │
│  └──────────────┬──────────────────┘  └───┬──────┬───────┘     │
├─────────────────┼─────────────────────────┼──────┼──────────────┤
│                     External Services                            │
│  ┌──────────────┴─────┐  ┌────────────┴──┐  ┌───┴──────────┐   │
│  │  Google Calendar    │  │  Telegram     │  │  Email        │   │
│  │  API (FreeBusy +   │  │  Bot API      │  │  (Resend)     │   │
│  │  Events)            │  │              │  │              │   │
│  └────────────────────┘  └──────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Readiness Checklist | Gate access to slots — qualify prospects | Client-side form with checkboxes, no API call |
| Slot Picker | Display available dates and time slots | Calendar grid + time list, fetches from /api/slots |
| Booking Form | Collect name + email, submit booking | Simple form, POST to /api/book |
| Availability Engine | Compute free slots from config minus busy times | Server-side: merge availability windows with FreeBusy results |
| Booking Service | Create calendar event + dispatch notifications | Server-side: Google Calendar insert + Telegram + email |
| Availability Config | Define when Enzo is bookable (days, hours, buffer) | Static config object or env vars — NOT a database |

## Recommended Project Structure

```
src/
├── app/                        # Next.js App Router
│   ├── page.tsx                # Booking page (readiness → slots → form)
│   ├── confirmation/
│   │   └── page.tsx            # Post-booking confirmation page
│   ├── api/
│   │   ├── slots/
│   │   │   └── route.ts        # GET: available slots for a date range
│   │   └── book/
│   │       └── route.ts        # POST: create booking
│   └── layout.tsx              # Dark theme shell
├── components/
│   ├── readiness-checklist.tsx  # Checklist gate
│   ├── date-picker.tsx         # Date selection (calendar grid)
│   ├── time-slots.tsx          # Time slot list for selected date
│   └── booking-form.tsx        # Name + email + confirm
├── lib/
│   ├── availability/
│   │   ├── config.ts           # Availability windows, buffer, duration
│   │   ├── engine.ts           # Slot generation + conflict resolution
│   │   └── timezone.ts         # Timezone conversion utilities
│   ├── google-calendar/
│   │   ├── client.ts           # Google API auth (service account)
│   │   ├── freebusy.ts         # FreeBusy query wrapper
│   │   └── events.ts           # Event creation wrapper
│   ├── notifications/
│   │   ├── telegram.ts         # Telegram Bot API notification
│   │   └── email.ts            # Transactional email (confirmation + reminder)
│   └── types.ts                # Shared types (TimeSlot, Booking, etc.)
└── styles/
    └── globals.css             # Dark theme, Inter font, mobile-first
```

### Structure Rationale

- **lib/availability/:** Isolated from Google Calendar specifics. The engine takes "potential slots" and "busy periods" as inputs — it does not care where busy periods come from. This makes testing trivial.
- **lib/google-calendar/:** Thin wrappers around Google API calls. If Google changes their API, only this folder changes.
- **lib/notifications/:** Each channel is independent. Adding a new notification channel means adding one file, not touching booking logic.
- **components/:** Each step of the booking flow is a standalone component. The page orchestrates them as a linear flow (checklist → date → time → form).

## Architectural Patterns

### Pattern 1: Google Calendar as Database

**What:** Use Google Calendar as the single source of truth for both availability and bookings. No separate database needed.
**When to use:** Single-user scheduling tools with low booking volume (Enzo's use case exactly).
**Trade-offs:**
- PRO: Zero database setup, events appear in Google Calendar automatically, Enzo already uses it
- PRO: Any event on Enzo's calendar (personal or work) automatically blocks slots
- CON: Google API rate limits (60 requests/minute per user) — irrelevant at Enzo's scale
- CON: No booking metadata beyond what fits in a calendar event (name, email, notes)

This is the right call for this project. A database would add complexity for zero benefit.

### Pattern 2: Server-Side Slot Generation

**What:** Generate all time slots on the server, never on the client. The client receives a flat list of available slots.
**When to use:** Always, for booking systems.
**Trade-offs:**
- PRO: Prevents timezone bugs (server controls the reference timezone)
- PRO: Client cannot see or manipulate availability logic
- CON: Slightly slower (API round-trip for slot data)

**Example:**
```typescript
// lib/availability/engine.ts
export function computeAvailableSlots(
  date: Date,
  config: AvailabilityConfig,
  busyPeriods: TimePeriod[]
): TimeSlot[] {
  const potential = generatePotentialSlots(date, config);
  const available = subtractBusyPeriods(potential, busyPeriods, config.bufferMinutes);
  return available.filter(slot => slot.start > new Date()); // no past slots
}
```

### Pattern 3: Double-Check Before Insert

**What:** Re-query Google Calendar for conflicts immediately before creating the event, even though slots were already filtered.
**When to use:** Always. Two users could select the same slot simultaneously.
**Trade-offs:**
- PRO: Eliminates race conditions where two people book the same slot
- CON: Extra API call on each booking (negligible cost)

**Example:**
```typescript
// api/book/route.ts
export async function POST(req: Request) {
  const { date, time, name, email } = await req.json();
  
  // Re-check availability RIGHT BEFORE creating event
  const conflicts = await checkConflicts(date, time, duration);
  if (conflicts.length > 0) {
    return Response.json({ error: "Slot no longer available" }, { status: 409 });
  }
  
  const event = await createCalendarEvent({ date, time, name, email });
  await Promise.all([
    sendTelegramNotification(event),
    sendConfirmationEmail(email, event),
  ]);
  
  return Response.json({ success: true, event });
}
```

### Pattern 4: Progressive Disclosure Flow

**What:** Show the booking flow as sequential steps: checklist → date → time → form → confirmation. Each step unlocks the next.
**When to use:** When you want to qualify prospects before giving them slots (Enzo's readiness checklist requirement).
**Trade-offs:**
- PRO: Reduces cognitive load, prospect focuses on one thing at a time
- PRO: Checklist acts as a psychological commitment device
- CON: More clicks than showing everything at once

## Data Flow

### Slot Discovery Flow

```
[Prospect loads page]
    ↓
[Readiness Checklist] → (all checked)
    ↓
[Date Picker requests slots]
    ↓
GET /api/slots?from=2026-04-07&to=2026-04-20
    ↓
[Availability Engine]
    ├── Read config (Tue/Thu 14h-18h, 30min slots, 15min buffer)
    ├── Generate potential slots for date range
    ├── Query Google Calendar FreeBusy API for busy periods
    └── Subtract busy from potential → return available slots
    ↓
[Client displays date grid with available slot counts]
    ↓
[Prospect selects date → sees time slots → selects time]
```

### Booking Flow

```
[Prospect fills name + email + confirms]
    ↓
POST /api/book { date, time, name, email }
    ↓
[Server validates input]
    ↓
[Re-check Google Calendar for conflicts]
    ├── Conflict found → 409 "Slot taken, please choose another"
    └── No conflict ↓
        ↓
[Create Google Calendar event]
    ↓ (parallel)
    ├── [Send Telegram notification to Enzo]
    ├── [Send confirmation email to prospect]
    └── [Return success to client]
    ↓
[Client shows confirmation page]
```

### Reminder Flow (Background)

```
[Cron job or Vercel Cron — runs daily]
    ↓
[Query Google Calendar for tomorrow's bookings]
    ↓
[For each booking with attendee email]
    └── [Send reminder email 24h before]
```

### Key Data Flows

1. **Slot computation:** Config (static) + Google FreeBusy (dynamic) → Available slots. This is the core engine. Config defines "when Enzo could be free," FreeBusy defines "when Enzo is actually busy."
2. **Booking creation:** Prospect form data → validation → conflict check → Google Calendar event → parallel notifications. The calendar event IS the booking record.
3. **Reminders:** Separate async process reads future events from Google Calendar and sends emails. Decoupled from booking flow entirely.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 1-50 bookings/month (Enzo's case) | Monolith is perfect. Google Calendar as DB. No caching needed. |
| 50-500 bookings/month | Add a 5-minute cache on FreeBusy results to reduce API calls. Still no DB needed. |
| 500+ bookings/month | Would need a proper database for booking metadata and queue-based notification processing. But this is NOT Enzo's problem. |

### Scaling Priorities

1. **First bottleneck:** Google Calendar API rate limits (60 req/min). At Enzo's scale (handful of bookings per week), this is completely irrelevant.
2. **Second bottleneck:** Email deliverability. Use a proper transactional email service (Resend) from day one to avoid spam folder issues.

## Anti-Patterns

### Anti-Pattern 1: Client-Side Slot Generation

**What people do:** Generate available time slots in the browser using JavaScript Date objects and the user's local timezone.
**Why it's wrong:** Timezone bugs are the #1 source of booking system failures. A user in UTC-5 sees "2 PM" but that maps to a different server time. Client clocks can be wrong. DST transitions cause phantom slots.
**Do this instead:** Generate all slots on the server in Enzo's timezone (Europe/Paris). Send ISO 8601 timestamps to the client. Client only formats for display.

### Anti-Pattern 2: Building a Database Layer

**What people do:** Create a bookings table, availability table, sync with Google Calendar bidirectionally.
**Why it's wrong:** For a single-user personal booking page, a database adds schema migrations, sync conflicts, and a second source of truth. If the DB says "free" but Google Calendar says "busy," which wins?
**Do this instead:** Google Calendar IS the database. Read from it, write to it. Zero sync issues.

### Anti-Pattern 3: Polling for Slot Updates

**What people do:** Set up WebSockets or short polling to update available slots in real-time.
**Why it's wrong:** For a low-traffic personal page, this wastes API calls and adds complexity. The chance of two prospects booking the same slot simultaneously is near zero.
**Do this instead:** Fetch slots once when the date picker loads. Re-check conflicts server-side before booking (Pattern 3 above). Show a clear error if the slot was taken.

### Anti-Pattern 4: Over-Engineering the Availability Config

**What people do:** Build a full admin UI with drag-and-drop time blocks, recurring rules, exception dates.
**Why it's wrong:** Enzo has ONE event type (30min discovery call) and simple availability (Tue/Thu 14h-18h). An admin UI is weeks of work for a config that changes once a month.
**Do this instead:** Define availability in a TypeScript config object. Change it by editing code. Takes 30 seconds.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Google Calendar API | Service account with domain-wide delegation OR OAuth refresh token | Service account is simpler: share calendar with service account email, no refresh token management. Requires "Make changes to events" permission on the calendar. |
| Google FreeBusy API | POST to `/calendar/v3/freeBusy` with timeMin/timeMax | Returns only busy intervals, not event details — good for privacy. Check ALL of Enzo's calendars to avoid conflicts with personal events. |
| Telegram Bot API | POST to `https://api.telegram.org/bot{token}/sendMessage` | Simple HTTP call, no SDK needed. Include prospect name, date/time, and email in the message. |
| Resend (email) | REST API or `resend` npm package | Confirmation email on booking, reminder email 24h before. Use a custom domain for deliverability. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Components → API | HTTP (fetch from client components) | Slot picker fetches GET /api/slots, booking form POSTs to /api/book |
| API → Availability Engine | Direct function call | Same process, no network hop. Engine is a pure function (config + busy periods → slots) |
| API → Google Calendar | HTTP via googleapis or raw fetch | Service account auth. Token refresh handled by google-auth-library. |
| API → Notifications | Fire-and-forget (Promise.all) | Booking succeeds even if Telegram/email fails. Log errors but don't block the response. |

## Build Order (Dependency Chain)

This is the critical insight for roadmap planning:

```
Phase 1: Availability Engine (no external deps)
   │      config.ts + engine.ts + tests
   │      Can build and test with mock data
   │
Phase 2: Google Calendar Integration
   │      client.ts + freebusy.ts + events.ts
   │      Wire engine to real calendar data
   │      Can test via API route returning JSON
   │
Phase 3: Booking Flow UI
   │      Components + API routes + confirmation page
   │      Requires Phase 1+2 for real slot data
   │
Phase 4: Notifications
   │      Telegram + email (confirmation)
   │      Independent of UI — can be added to /api/book
   │
Phase 5: Polish + Reminders
          Reminder cron, timezone display, error states,
          mobile refinements, dark theme polish
```

**Key dependency:** The availability engine (Phase 1) is a pure function with no external dependencies. It can be built and fully tested before touching Google APIs. This is the foundation everything else depends on.

**Parallel opportunity:** Notifications (Phase 4) are independent of the UI (Phase 3). They can be built in parallel or in either order.

## Sources

- [How I Built My Own Meeting Booking System — Andrii Furmanets](https://andriifurmanets.com/blogs/build-your-own-booking-system-comprehensive-guide) — Full walkthrough of Next.js + Google Calendar + Telegram booking system
- [Build Your Own Calendly-like Page with Next.js — Tim Feeley (DEV)](https://dev.to/timfee/build-and-host-your-own-calendy-like-scheduling-page-using-nextjs-and-google-apis-5ack) — Detailed slot generation algorithm and OAuth approach
- [Google Calendar FreeBusy API Reference](https://developers.google.com/workspace/calendar/api/v3/reference/freebusy/query) — Official docs for availability checking
- [Google Calendar API Overview](https://developers.google.com/workspace/calendar/api/guides/overview) — API capabilities and authentication methods

---
*Architecture research for: Personal booking/scheduling page*
*Researched: 2026-04-05*
