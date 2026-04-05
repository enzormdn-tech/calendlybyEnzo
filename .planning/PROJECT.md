# CalendlyByEnzo

## What This Is

A personal booking page for discovery calls (30min coaching sessions). Prospects land on the page, complete a readiness checklist, pick an available slot based on Enzo's defined availability and Google Calendar, and book. Enzo gets notified via Telegram and manages bookings through the Enzo OS dashboard.

## Core Value

A prospect can book a discovery call in under 2 minutes — no friction, no back-and-forth, no third-party branding.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Prospect sees a readiness checklist before accessing slots (30min available, quiet place, etc.)
- [ ] Prospect validates checklist to proceed to slot selection
- [ ] Available slots are computed from defined availability windows minus Google Calendar conflicts
- [ ] Enzo defines his availability windows (e.g., Tue/Thu 14h-18h)
- [ ] Prospect selects a slot and provides name + email to book
- [ ] Booking creates an event in Enzo's Google Calendar
- [ ] Enzo receives a Telegram notification on new booking
- [ ] Prospect receives a confirmation email after booking
- [ ] Prospect receives a reminder email before the scheduled call
- [ ] Enzo OS dashboard shows upcoming and past bookings
- [ ] Calendly best practices applied (UX, timezone handling, buffer between meetings, etc.)

### Out of Scope

- Multiple event types — v1 is discovery call only (30min)
- Multi-user / multi-coach — this is Enzo's personal tool
- Payment integration — discovery calls are free
- Rescheduling/cancellation by prospect — v1 is book-only
- Custom branding editor — design is hardcoded to Enzo's brand

## Context

- Enzo runs a coaching business targeting 1500€/month revenue
- The booking page is the final step in a funnel: burnout quiz → results → CTA → book a call
- Must feel premium and personal — not a generic SaaS tool
- Connects to Enzo OS ecosystem (dashboard, Telegram notifications)
- Cream/light minimalist design using burnout-quiz style (Inter font 300/400, #fafaf8 background, #1c1c1c text). Reference: `/Users/Enzo/burnout-quiz/style.css`

## Constraints

- **Stack**: To be determined by research — likely Next.js given Enzo OS ecosystem
- **Auth**: No prospect auth needed — booking is anonymous (name + email only)
- **Calendar**: Google Calendar API for availability checking and event creation
- **Notifications**: Telegram Bot API for instant notifications to Enzo
- **Email**: Brevo (existing account) — sender: contact@remidene-enzo.com, name: "Mini-Coaching Remidene Enzo"
- **Domain**: remidene-enzo (Squarespace domain, DNS pointed to Vercel)
- **Hosting**: Vercel (deployment config in Phase 1 or first deploy)
- **Design**: Cream/light theme (burnout-quiz style: #fafaf8 bg, #1c1c1c text, Inter 300/400), minimalist, mobile-first

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Single event type (30min discovery) | Simplicity, only current need | — Pending |
| Readiness checklist before slots | Qualify prospects, set expectations | — Pending |
| Google Calendar as source of truth | Enzo already uses it, avoids double-booking | — Pending |
| Telegram for notifications | Enzo's preferred notification channel via Enzo OS | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-05 after initialization*
