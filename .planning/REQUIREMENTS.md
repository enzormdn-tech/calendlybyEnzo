# Requirements: CalendlyByEnzo

**Defined:** 2026-04-05
**Core Value:** A prospect can book a discovery call in under 2 minutes — no friction, no back-and-forth, no third-party branding.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Booking Page (Sales)

- [x] **PAGE-01**: Prospect lands on a mini sales page explaining what to expect during the 30min mini-coaching
- [x] **PAGE-02**: Page follows cream/light minimalist design (Inter 300/400, #fafaf8 bg, #1c1c1c text) consistent with burnout-quiz style
- [x] **PAGE-03**: Page is mobile-first and fully responsive

### Readiness Checklist

- [x] **CHECK-01**: Prospect sees a readiness checklist after the sales section (30min available, quiet place, etc.)
- [x] **CHECK-02**: Prospect must validate all items before accessing the slot picker

### Availability & Slots

- [ ] **AVAIL-01**: Enzo defines availability windows from a dashboard (e.g., Tue/Thu 14h-18h)
- [x] **AVAIL-02**: Available slots are computed from availability windows minus Google Calendar busy times
- [x] **AVAIL-03**: Buffer time (15min) is enforced between bookings
- [x] **AVAIL-04**: Minimum scheduling notice enforced (24h)
- [x] **AVAIL-05**: Maximum future booking window enforced (2 weeks)
- [ ] **AVAIL-06**: Prospect sees available slots by day and selects one

### Booking

- [ ] **BOOK-01**: Prospect provides name + email to confirm booking
- [ ] **BOOK-02**: System re-checks Google Calendar before confirming (race condition prevention)
- [x] **BOOK-03**: Booking creates an event in Enzo's Google Calendar with prospect details

### Confirmation

- [ ] **CONF-01**: Prospect sees a confirmation screen with date, time, and what to expect
- [ ] **CONF-02**: Prospect receives a confirmation email with date, time, details, and .ics file
- [ ] **CONF-03**: Prospect receives a reminder email 24h before the scheduled call

### Notifications

- [ ] **NOTIF-01**: Enzo receives a Telegram notification on new booking (name, email, date/time)

### Dashboard (Enzo OS)

- [ ] **DASH-01**: Dashboard shows list of upcoming bookings
- [ ] **DASH-02**: Dashboard shows history of past bookings
- [ ] **DASH-03**: Dashboard allows configuring availability windows

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Enhanced UX

- **UX-01**: Timezone auto-detection and display for international prospects
- **UX-02**: Prospect-initiated rescheduling via magic link
- **UX-03**: Prospect-initiated cancellation via magic link

### Multiple Event Types

- **EVENT-01**: Support multiple event types (15min, 30min, 60min)
- **EVENT-02**: Event type selector on booking page

### Analytics

- **ANAL-01**: Booking conversion tracking (page view → checklist → slot select → booked)
- **ANAL-02**: No-show tracking

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Payment collection | Discovery calls are free |
| Multi-user / multi-coach | Personal tool for Enzo only |
| Full intake form (beyond name+email) | Long forms kill conversion |
| SMS reminders | Over-engineered for v1, email sufficient |
| Real-time slot polling | Low volume, no practical benefit |
| Custom branding editor | Design is hardcoded to Enzo's brand |
| OAuth / account creation for prospects | Stateless booking, no auth needed |
| Timezone handling | Prospects are in France, not needed for v1 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PAGE-01 | Phase 4 | Complete |
| PAGE-02 | Phase 1 | Complete |
| PAGE-03 | Phase 1 | Complete |
| CHECK-01 | Phase 4 | Complete |
| CHECK-02 | Phase 4 | Complete |
| AVAIL-01 | Phase 8 | Pending |
| AVAIL-02 | Phase 2 | Complete |
| AVAIL-03 | Phase 2 | Complete |
| AVAIL-04 | Phase 2 | Complete |
| AVAIL-05 | Phase 2 | Complete |
| AVAIL-06 | Phase 5 | Pending |
| BOOK-01 | Phase 6 | Pending |
| BOOK-02 | Phase 6 | Pending |
| BOOK-03 | Phase 3 | Complete |
| CONF-01 | Phase 6 | Pending |
| CONF-02 | Phase 7 | Pending |
| CONF-03 | Phase 8 | Pending |
| NOTIF-01 | Phase 7 | Pending |
| DASH-01 | Phase 8 | Pending |
| DASH-02 | Phase 8 | Pending |
| DASH-03 | Phase 8 | Pending |

**Coverage:**
- v1 requirements: 21 total
- Mapped to phases: 21
- Unmapped: 0

---
*Requirements defined: 2026-04-05*
*Last updated: 2026-04-05 after roadmap creation*
