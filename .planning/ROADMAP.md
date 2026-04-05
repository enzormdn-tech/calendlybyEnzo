# Roadmap: CalendlyByEnzo

## Overview

CalendlyByEnzo is a personal booking page for coaching discovery calls. The build follows the dependency chain validated by research: availability engine first (pure logic, no external deps), then Google Calendar integration, then the booking UI in vertical slices (page, slots, form), then notifications, then dashboard and reminders. Eight phases deliver 21 requirements with fine granularity.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Project Setup** - Next.js 15 scaffold with Tailwind, burnout-quiz cream theme, and project foundation
- [ ] **Phase 2: Availability Engine** - Pure slot computation: config + busy periods = available slots
- [ ] **Phase 3: Google Calendar Integration** - OAuth setup, FreeBusy queries, and event creation
- [ ] **Phase 4: Booking Page & Checklist** - Sales page with readiness checklist gate
- [ ] **Phase 5: Slot Picker** - Date/time selection UI connected to live availability API
- [ ] **Phase 6: Booking Submission** - Form, race condition guard, calendar event creation, confirmation screen
- [ ] **Phase 7: Notifications & Email** - Telegram notification + confirmation email with .ics attachment
- [ ] **Phase 8: Dashboard & Reminders** - Enzo OS dashboard for bookings + reminder email cron

## Phase Details

### Phase 1: Project Setup
**Goal**: A running Next.js 15 project with Tailwind cream/light theme (burnout-quiz style), Inter font, and the project structure ready for feature development
**Depends on**: Nothing (first phase)
**Requirements**: PAGE-02, PAGE-03
**Success Criteria** (what must be TRUE):
  1. Next.js dev server starts and renders a page with burnout-quiz cream theme (#fafaf8 background, #1c1c1c text, Inter font weight 300/400). Reference: `/Users/Enzo/burnout-quiz/style.css`
  2. Page is mobile-first and fully responsive across phone, tablet, and desktop viewports
  3. Tailwind is configured with burnout-quiz design tokens (--bg: #fafaf8, --text: #1c1c1c, --sub: #6b6b6b, --border: #e5e3df, --accent: #1c1c1c, --btn-idle: #f0eeeb, --btn-hover: #e8e4df)
**Plans**: 1 plan
Plans:
- [ ] 01-01-PLAN.md — Scaffold Next.js 15 with burnout-quiz cream theme, Inter font, Tailwind tokens, and Drizzle ORM setup
**UI hint**: yes

### Phase 2: Availability Engine
**Goal**: A tested, reliable slot computation engine that accepts availability config + busy periods and returns available time slots
**Depends on**: Phase 1
**Requirements**: AVAIL-02, AVAIL-03, AVAIL-04, AVAIL-05
**Success Criteria** (what must be TRUE):
  1. Given availability windows and a list of busy periods, the engine returns correct available 30-min slots
  2. Buffer time (15min) is enforced between consecutive slots — no back-to-back bookings possible
  3. Slots within the next 24 hours are excluded (minimum scheduling notice)
  4. Slots beyond 2 weeks in the future are excluded (maximum booking window)
  5. All times are handled in Europe/Paris timezone with correct DST behavior
**Plans**: TBD

### Phase 3: Google Calendar Integration
**Goal**: The availability engine is wired to Enzo's real Google Calendar — FreeBusy queries return real busy times, and events can be created programmatically
**Depends on**: Phase 2
**Requirements**: BOOK-03
**Success Criteria** (what must be TRUE):
  1. An API route (`/api/slots`) returns available slots computed from real Google Calendar busy times
  2. An API route (`/api/book`) can create an event in Enzo's Google Calendar with prospect details (name, email, date/time)
  3. OAuth refresh token is stored securely and does not expire (Google Cloud project in production mode)
**Plans**: TBD

### Phase 4: Booking Page & Checklist
**Goal**: Prospects land on a compelling sales page and must pass a readiness checklist before seeing slots
**Depends on**: Phase 1
**Requirements**: PAGE-01, CHECK-01, CHECK-02
**Success Criteria** (what must be TRUE):
  1. Prospect sees a sales section explaining the 30min mini-coaching format and what to expect
  2. Below the sales section, prospect sees a readiness checklist (30min available, quiet place, etc.)
  3. Slot picker is hidden until all checklist items are validated
  4. Checklist validation is clear and intuitive (checkboxes + unlock button or equivalent)
**Plans**: TBD
**UI hint**: yes

### Phase 5: Slot Picker
**Goal**: Prospects can browse available days and select a specific time slot from live availability data
**Depends on**: Phase 3, Phase 4
**Requirements**: AVAIL-06
**Success Criteria** (what must be TRUE):
  1. After passing the checklist, prospect sees available dates for the next 2 weeks
  2. Selecting a date shows available 30-min time slots for that day
  3. Slots are fetched from the live `/api/slots` endpoint (real Google Calendar data)
  4. Empty days are either hidden or clearly marked as unavailable
**Plans**: TBD
**UI hint**: yes

### Phase 6: Booking Submission
**Goal**: Prospect can complete a booking that creates a real Google Calendar event, with race condition protection
**Depends on**: Phase 5
**Requirements**: BOOK-01, BOOK-02, CONF-01
**Success Criteria** (what must be TRUE):
  1. After selecting a slot, prospect provides name and email to confirm the booking
  2. System re-checks Google Calendar for conflicts before confirming (race condition prevention)
  3. On success, prospect sees a confirmation screen with date, time, and what to expect
  4. If the slot was taken between selection and submission, prospect sees a clear error and can pick another slot
**Plans**: TBD
**UI hint**: yes

### Phase 7: Notifications & Email
**Goal**: Both Enzo and the prospect are notified immediately after a successful booking
**Depends on**: Phase 6
**Requirements**: NOTIF-01, CONF-02
**Success Criteria** (what must be TRUE):
  1. Enzo receives a Telegram message with prospect name, email, and booking date/time within seconds of a booking
  2. Prospect receives a confirmation email with date, time, details, and a downloadable .ics calendar file
  3. If Telegram or email fails, the booking itself still succeeds (fire-and-forget notifications)
**Plans**: TBD

### Phase 8: Dashboard & Reminders
**Goal**: Enzo can manage bookings and availability from a dashboard, and prospects get reminded before their call
**Depends on**: Phase 7
**Requirements**: DASH-01, DASH-02, DASH-03, AVAIL-01, CONF-03
**Success Criteria** (what must be TRUE):
  1. Dashboard shows a list of upcoming bookings with prospect details and dates
  2. Dashboard shows history of past bookings
  3. Enzo can configure availability windows (e.g., Tue/Thu 14h-18h) from the dashboard
  4. Prospect receives a reminder email 24 hours before the scheduled call
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Project Setup | 0/1 | Planning complete | - |
| 2. Availability Engine | 0/0 | Not started | - |
| 3. Google Calendar Integration | 0/0 | Not started | - |
| 4. Booking Page & Checklist | 0/0 | Not started | - |
| 5. Slot Picker | 0/0 | Not started | - |
| 6. Booking Submission | 0/0 | Not started | - |
| 7. Notifications & Email | 0/0 | Not started | - |
| 8. Dashboard & Reminders | 0/0 | Not started | - |
