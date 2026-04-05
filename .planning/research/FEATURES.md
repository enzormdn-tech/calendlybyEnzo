# Feature Research

**Domain:** Personal booking/scheduling page for coaching discovery calls
**Researched:** 2026-04-05
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features prospects assume exist when landing on a booking page. Missing any of these and the page feels broken or untrustworthy.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Available slot display | Core purpose of a booking page. Prospects must see when you are free. | MEDIUM | Compute from availability windows minus Google Calendar conflicts. Display by day with selectable time slots. |
| Google Calendar sync (read) | Prevents double-booking. Every scheduling tool does this. | MEDIUM | Google Calendar API. Read busy/free times. Must handle OAuth token refresh. |
| Google Calendar event creation (write) | Booking must appear on Enzo's calendar automatically. Manual entry defeats the purpose. | LOW | Create event with prospect name, email, and meeting details in description. |
| Timezone detection + display | International prospects (or even French in different zones) will see wrong times without it. Every competitor auto-detects timezone. | MEDIUM | Auto-detect via `Intl.DateTimeFormat().resolvedOptions().timeZone`. Show times in prospect's local timezone. Allow manual override. Store booking in UTC. |
| Booking confirmation screen | Prospect needs immediate feedback that booking succeeded. Without it, they wonder and may re-book. | LOW | Show date, time (in their timezone), and what to expect. |
| Confirmation email | Standard in every booking tool. Prospect needs a record with date/time/details they can reference. | MEDIUM | Transactional email with: date, time, timezone, what to prepare, how to join. Include .ics calendar attachment. |
| Mobile-responsive design | Over 60% of web traffic is mobile. Coaching funnel prospects often come from LinkedIn/social on their phones. | LOW | Mobile-first approach already in Enzo's design system. Calendar/slot picker must be thumb-friendly. |
| Name + email collection | Minimum info to identify who booked. Every booking tool requires this. | LOW | Simple form: first name, email. No account creation. |
| Booking success feedback | Prospect must know the booking went through without ambiguity. | LOW | Clear confirmation state after submission. Redirect or inline confirmation with details. |

### Differentiators (Competitive Advantage)

Features that make CalendlyByEnzo feel premium and personal vs. a generic Calendly link. These align with the core value: "no third-party branding, feels premium and personal."

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Readiness checklist (pre-qualification gate) | Filters out unserious prospects. Sets expectations. Makes the call higher quality. No competitor does this natively without paid routing forms. | LOW | Checklist: 30min available, quiet place, ready to discuss goals. Must validate before seeing slots. Already in PROJECT.md requirements. |
| Custom branded experience (no SaaS branding) | Feels like Enzo's own product, not a widget. Competitors charge $8-20/month for brand removal. Calendly cannot even do custom domains without third-party hacks. | LOW | Built from scratch = zero third-party branding by default. Matches Enzo's dark theme (#0f0f0f, Inter font). |
| Telegram notification to Enzo | Instant awareness without checking email. Enzo already uses Telegram via Enzo OS. Competitors offer email/SMS notifications but not Telegram natively. | LOW | Telegram Bot API. Send message with prospect name, email, date/time on booking. |
| Reminder email (24h before) | Reduces no-shows by up to 23%. Not all free-tier scheduling tools include automated reminders. | MEDIUM | Requires a scheduled job or cron. Send 24h before appointment. Include date, time, what to prepare. |
| Buffer time between meetings | Prevents back-to-back bookings. Gives Enzo prep time. Standard in paid tiers of Calendly but not always on free tools. | LOW | When computing available slots, subtract buffer (e.g., 15min) before and after existing events. |
| Minimum scheduling notice | Prevents someone from booking 5 minutes from now. Standard in Calendly (paid) but a smart default. | LOW | e.g., minimum 24h notice. Filter out slots earlier than threshold. |
| Maximum future booking window | Prevents booking 6 months out. Keeps calendar predictable. | LOW | e.g., max 2 weeks ahead. Only show slots within window. |
| .ics calendar file in confirmation email | Prospect can add the event to their own calendar with one click. Professional touch that competitors include. | LOW | Generate .ics file and attach to confirmation email. Standard iCalendar format. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem like good ideas but would add complexity without proportional value for Enzo's single-user, single-event-type use case.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Multiple event types | "What if I want 15min, 30min, 60min options?" | v1 is discovery call only. Multiple types adds UI complexity, decision fatigue for prospects, and config management. Premature for a coaching funnel with one CTA. | Hardcode 30min. Add event types only when a real second use case appears. |
| Prospect-initiated rescheduling/cancellation | "What if they need to change?" | Requires persistent booking storage, auth tokens or magic links, cancellation policy logic, calendar event updates. Massive complexity for low volume. | Include Enzo's email in confirmation. "Need to reschedule? Reply to this email." Human touch is a feature for a coach. |
| Payment collection at booking | "Charge for paid sessions at booking time." | Discovery calls are free. Adding Stripe adds OAuth, webhook handling, refund logic, and PCI concerns. | If Enzo launches paid sessions later, build payment as a separate phase. |
| Multi-user / team scheduling | "What if I hire another coach?" | Entirely different product. Multi-user adds auth, permissions, round-robin logic, per-user calendars. | Build for one user. If this grows, it becomes a separate product decision. |
| Full intake form (many fields) | "Collect more info before the call." | Long forms kill conversion. Each additional field reduces completion rate. Discovery call is about conversation, not paperwork. | Name + email only. The readiness checklist qualifies intent without data collection friction. |
| Real-time availability polling | "Show slots updating live as other people book." | Single-user, low-volume tool. Real-time adds WebSocket complexity for zero practical benefit when Enzo gets maybe 5-10 bookings/week max. | Fetch availability on page load. If someone else books the same slot in the 2-minute window, handle the conflict gracefully on submission (re-check calendar, show "slot taken" message). |
| SMS reminders | "Text reminders have 90% open rates." | Requires SMS provider (Twilio), phone number collection, international number handling, cost per message. Over-engineered for v1. | Email reminders. Add SMS only if no-show rate is problematic after launch. |
| Custom branding editor | "Let me change colors and fonts from a UI." | It is Enzo's personal page. The design is hardcoded to his brand. A branding editor is SaaS product thinking, not personal tool thinking. | Hardcode the design. Change in code when needed. |
| OAuth / account creation for prospects | "Track returning prospects." | Adds auth complexity, privacy concerns, GDPR obligations. Prospects book once for a discovery call. | Stateless booking. Identify by email if needed for future features. |

## Feature Dependencies

```
[Google Calendar OAuth]
    |
    +--requires--> [Read busy/free times]
    |                  |
    |                  +--enables--> [Available slot computation]
    |                                    |
    |                                    +--enables--> [Slot display UI]
    |                                    |                 |
    |                                    |                 +--enables--> [Booking form]
    |                                    |                                   |
    |                                    |                                   +--enables--> [Calendar event creation]
    |                                    |                                   +--enables--> [Confirmation email]
    |                                    |                                   +--enables--> [Telegram notification]
    |                                    |
    |                                    +--enhanced-by--> [Buffer time logic]
    |                                    +--enhanced-by--> [Min notice / max window]
    |
[Readiness checklist] --gates--> [Slot display UI]

[Confirmation email]
    +--enhanced-by--> [.ics attachment]
    +--enables--> [Reminder email (24h before)]

[Availability config (admin)]
    +--feeds--> [Available slot computation]
```

### Dependency Notes

- **Google Calendar OAuth is the foundation:** Everything depends on reading calendar data and writing events. This must work first.
- **Slot computation is the core algorithm:** Merges availability windows with calendar busy times, buffer rules, min notice, and max window. Central to the product.
- **Readiness checklist is independent but gates the flow:** Can be built in parallel with calendar logic. Simply gates access to the slot picker.
- **Confirmation email enables reminder email:** Reminder needs the same email infrastructure + a scheduling mechanism.
- **Availability config (admin) is needed before slot computation:** Enzo must define when he is available (e.g., Tue/Thu 14h-18h) before the system can compute open slots.

## MVP Definition

### Launch With (v1)

Minimum viable product -- what gets Enzo booking discovery calls through his own page.

- [x] Readiness checklist gate -- qualifies prospects, sets expectations (LOW complexity)
- [x] Availability windows config -- Enzo defines Tue/Thu 14h-18h or similar (LOW complexity)
- [x] Google Calendar integration (read + write) -- check conflicts, create events (MEDIUM complexity)
- [x] Timezone-aware slot display -- prospects see times in their timezone (MEDIUM complexity)
- [x] Booking form (name + email + selected slot) -- minimal friction (LOW complexity)
- [x] Google Calendar event creation on booking -- source of truth (LOW complexity)
- [x] Confirmation screen with booking details -- immediate feedback (LOW complexity)
- [x] Confirmation email with .ics attachment -- prospect has a record (MEDIUM complexity)
- [x] Telegram notification to Enzo -- instant awareness (LOW complexity)
- [x] Buffer time between meetings (15min default) -- prevents back-to-back (LOW complexity)
- [x] Minimum scheduling notice (24h) -- prevents last-minute bookings (LOW complexity)
- [x] Maximum booking window (2-3 weeks) -- keeps calendar predictable (LOW complexity)
- [x] Mobile-responsive dark theme UI -- matches Enzo's brand (LOW complexity)

### Add After Validation (v1.x)

Features to add once core booking is working and Enzo has real usage data.

- [ ] Reminder email 24h before -- add when email infrastructure is stable and Enzo observes no-show patterns
- [ ] Enzo OS dashboard integration (upcoming/past bookings view) -- add when there are enough bookings to warrant a dashboard
- [ ] Conflict-on-submit handling -- re-check calendar at submission time in case of race condition (add if double-bookings actually happen)

### Future Consideration (v2+)

Features to defer until the tool proves its value.

- [ ] Multiple event types -- only if Enzo adds paid sessions or different call lengths
- [ ] Prospect rescheduling via magic link -- only if no-show/reschedule volume becomes a pain point
- [ ] SMS reminders -- only if email reminders prove insufficient for no-show reduction
- [ ] Payment integration -- only when paid sessions exist

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Slot display + booking form | HIGH | MEDIUM | P1 |
| Google Calendar read/write | HIGH | MEDIUM | P1 |
| Timezone handling | HIGH | MEDIUM | P1 |
| Confirmation screen | HIGH | LOW | P1 |
| Readiness checklist | HIGH | LOW | P1 |
| Confirmation email + .ics | HIGH | MEDIUM | P1 |
| Telegram notification | MEDIUM | LOW | P1 |
| Buffer time | MEDIUM | LOW | P1 |
| Min notice / max window | MEDIUM | LOW | P1 |
| Mobile-responsive UI | HIGH | LOW | P1 |
| Reminder email (24h) | MEDIUM | MEDIUM | P2 |
| Dashboard view | MEDIUM | MEDIUM | P2 |
| Conflict-on-submit re-check | LOW | LOW | P2 |
| Multiple event types | LOW | MEDIUM | P3 |
| Rescheduling flow | LOW | HIGH | P3 |
| Payment integration | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Calendly (Free) | Cal.com (Free) | TidyCal ($29 lifetime) | SavvyCal ($16/mo) | CalendlyByEnzo |
|---------|-----------------|----------------|------------------------|--------------------|--------------------|
| Single event type | 1 only | Unlimited | 10 | Unlimited | 1 (by design) |
| Calendar integrations | 1 calendar | Unlimited | Google, Outlook | Google, Outlook, iCloud | 1 Google Calendar |
| Timezone auto-detect | Yes | Yes | Yes | Yes | Yes |
| Custom branding | No (paid) | Yes | Limited | Yes | Full (built-in) |
| Remove vendor branding | No ($10/mo) | Yes (free) | Yes | Yes | N/A (no vendor) |
| Custom domain | No | Yes (paid) | No | Yes ($33/mo) | Yes (own domain) |
| Buffer time | No (paid) | Yes | Yes | Yes | Yes |
| Pre-booking questions | No (paid routing) | Yes | Yes | Yes | Yes (readiness checklist) |
| Email reminders | No (paid) | Yes | Yes | Yes | Yes (v1.x) |
| Confirmation email | Yes | Yes | Yes | Yes | Yes |
| .ics attachment | Yes | Yes | Yes | Yes | Yes |
| Payment collection | No (paid) | Yes (free) | Yes | Yes | No (not needed) |
| Telegram notification | No | No | No | No | Yes |
| Group booking | No (paid) | Yes | Yes | Yes | No (not needed) |

**Key insight:** By building a custom tool, Enzo gets features that cost $10-20/month on competitors (brand removal, buffer time, pre-booking questions, custom domain) for free. The trade-off is development time, but the feature set needed is small and well-defined.

## Sources

- [Calendly Features](https://calendly.com/features) -- official feature list
- [Calendly Pricing](https://calendly.com/pricing) -- what is free vs paid
- [Cal.com vs Calendly comparison](https://cal.com/scheduling/calcom-vs-calendly) -- feature comparison
- [Cal.com vs Calendly 2026](https://youcanbook.me/blog/calendly-vs-cal-dot-com) -- independent comparison
- [TidyCal](https://tidycal.com) -- feature overview
- [SavvyCal](https://savvycal.com/) -- feature overview and custom domain info
- [Acuity Scheduling - scheduling features](https://acuityscheduling.com/learn/scheduling-software-features) -- industry feature patterns
- [Strategies to reduce no-shows](https://www.booknetic.com/blog/strategies-to-reduce-no-shows) -- no-show reduction best practices
- [Appointment confirmation email best practices](https://www.booknetic.com/blog/appointment-confirmation-email-best-practices) -- email patterns
- [Coaching intake form questions](https://paperbell.com/blog/life-coach-intake-form/) -- coaching-specific booking patterns

---
*Feature research for: Personal booking/scheduling page (coaching discovery calls)*
*Researched: 2026-04-05*
