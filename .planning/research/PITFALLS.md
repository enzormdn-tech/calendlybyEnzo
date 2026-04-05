# Pitfalls Research

**Domain:** Personal booking/scheduling page (Calendly-like)
**Researched:** 2026-04-05
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Race Condition Double-Booking

**What goes wrong:**
Two prospects load the booking page simultaneously, both see the same slot as available, both submit. Result: two bookings for the same 30-minute window. Google Calendar will happily create overlapping events -- it has no built-in conflict prevention for API-created events.

**Why it happens:**
The availability check (freeBusy query or events list) and the event creation are two separate API calls with no atomicity guarantee. Between check and create, another booking can slip through. This is the classic TOCTOU (time-of-check-to-time-of-use) race condition.

**How to avoid:**
1. After creating the Google Calendar event, immediately re-query freeBusy for that slot to verify no overlap was created.
2. Use a server-side mutex (simple approach for single-instance: an in-memory lock per time slot; or a database row-level lock if using a DB).
3. For Enzo's scale (personal booking page, maybe 1-5 bookings/week), a simple approach works: create the event optimistically, then verify. If conflict detected, delete the just-created event and return an error to the second prospect.
4. Add a short "hold" mechanism: when a prospect clicks a slot, mark it as tentatively reserved for 5 minutes server-side before they complete the form.

**Warning signs:**
- No server-side state between "show available slots" and "confirm booking"
- Availability computed purely from Google Calendar with no local lock
- Testing only with sequential requests, never concurrent ones

**Phase to address:**
Core booking logic phase (slot selection + booking creation). Must be designed in from the start, not bolted on later.

---

### Pitfall 2: Google Calendar OAuth Token Expiring Silently

**What goes wrong:**
The booking page works perfectly for weeks, then suddenly all availability checks fail with 401 errors. Prospects see zero available slots or get a generic error. Enzo doesn't notice until someone tells him "your booking page is broken."

**Why it happens:**
Google OAuth2 refresh tokens can expire or be revoked for several reasons:
- Token unused for 6 months (unlikely but possible during off-seasons)
- Enzo changes his Google password (invalidates tokens with Gmail scopes)
- Google's 50 refresh token limit per user per client -- creating new tokens (e.g., re-authorizing during dev) silently invalidates older ones
- App in "testing" mode in Google Cloud Console: tokens expire after 7 days

**How to avoid:**
1. Move the Google Cloud project to "production" publishing status before launch (testing mode tokens expire in 7 days).
2. Store refresh token securely and implement proper token refresh with error handling.
3. Add a health check endpoint that tests Google Calendar connectivity -- hit it with a cron job or uptime monitor.
4. On token failure, send Enzo a Telegram alert immediately (not just log it).
5. Build a simple re-auth flow so Enzo can re-authorize without redeploying.

**Warning signs:**
- App still in "testing" publishing status in Google Cloud Console
- No monitoring or alerting on Google API failures
- Refresh token stored only in environment variable with no refresh mechanism
- Multiple re-authorizations during development (burning through the 50-token limit)

**Phase to address:**
Google Calendar integration phase. The health check and alerting should be part of the notifications phase.

---

### Pitfall 3: Timezone Display Causing Wrong Bookings

**What goes wrong:**
Prospect in a different timezone sees "14:00" and books, thinking it's 14:00 their time. It's actually 14:00 Paris time. They show up 1-2 hours early/late, or miss the call entirely. Alternatively: the slots display correctly but the Google Calendar event is created at the wrong time due to timezone conversion bugs.

**Why it happens:**
JavaScript Date objects silently attach the browser's local timezone. If the server generates slots in Europe/Paris but the frontend displays them without explicit timezone annotation, the browser may "helpfully" convert them. Storing or transmitting times as bare strings like "14:00" without timezone context is the root cause. Additionally, DST transitions (France switches clocks in late March and late October) can shift slots by 1 hour if not handled.

**How to avoid:**
1. All times stored and transmitted as ISO 8601 with explicit timezone offset (e.g., `2026-04-08T14:00:00+02:00`) or as UTC.
2. Display slots with explicit timezone label: "14:00 (heure de Paris)" -- always show the timezone.
3. Since this is a personal booking page for a France-based coach, define availability in Europe/Paris (IANA timezone name, never "CET" or "CEST" abbreviations).
4. Use `Intl.DateTimeFormat` with explicit `timeZone: 'Europe/Paris'` for display.
5. Test specifically around DST transition dates (last Sunday of March and October).

**Warning signs:**
- Times stored as bare "HH:MM" strings without timezone
- No timezone label visible in the booking UI
- Using `new Date()` without explicit timezone handling
- No DST transition test cases

**Phase to address:**
Core booking logic phase (availability computation). Must be correct from day one -- timezone bugs are notoriously hard to debug after the fact.

---

### Pitfall 4: Email Confirmation Landing in Spam

**What goes wrong:**
Prospect books a call, sees the success screen, but never receives the confirmation email. They forget about the call or doubt whether the booking went through. Enzo also looks unprofessional when the prospect has no calendar invite or meeting details.

**Why it happens:**
- Sending from a new domain with no email reputation
- Missing or misconfigured SPF, DKIM, and DMARC records
- Using a shared IP (common with free tiers of email services) that has poor reputation
- Email content triggers spam filters (too many links, no plain-text version, missing unsubscribe header even though it's transactional)
- Mixing marketing and transactional email on the same domain/subdomain

**How to avoid:**
1. Use a dedicated transactional email service (Resend or Postmark -- both have strong transactional deliverability and good free tiers).
2. Set up SPF, DKIM, and DMARC on the sending domain before sending a single email.
3. Send from a subdomain like `mail.enzo-domain.com` to protect the main domain's reputation.
4. Keep emails minimal and text-focused -- a simple confirmation with date, time, and meeting link. No heavy HTML, no images.
5. Include both HTML and plain-text versions.
6. Test with mail-tester.com before launch.
7. As a fallback, always include the Google Calendar invite (.ics) as an attachment -- even if the email lands in spam, the calendar invite often gets through separately.

**Warning signs:**
- No SPF/DKIM/DMARC records configured
- Using `gmail.com` or generic domain as sender
- No email delivery monitoring (bounce rates, spam complaints)
- Testing only with your own email address (which may whitelist you)

**Phase to address:**
Email/notifications phase. Must be verified with external test addresses before launch.

---

### Pitfall 5: Using Events.list Instead of FreeBusy for Availability

**What goes wrong:**
Fetching all events from Google Calendar to compute availability leaks private event details (titles, descriptions, attendees) into your server logs or responses. It's also slower, requires more permissions (read access to all events vs. just free/busy status), and needs complex overlap resolution logic.

**Why it happens:**
Developers reaching for the most obvious API endpoint (`events.list`) rather than the purpose-built `freebusy.query`. The freeBusy endpoint exists specifically for this use case but is less documented in tutorials.

**How to avoid:**
1. Use the `freebusy.query` endpoint for availability checks. It returns only busy time blocks, no event details.
2. Request only `https://www.googleapis.com/auth/calendar.freebusy` scope (or `calendar.readonly` at most) -- not full `calendar` read/write for the availability check.
3. Reserve `calendar.events` scope only for creating the booking event itself.
4. This also handles multi-calendar scenarios correctly (personal + work calendars blocking the same slots).

**Warning signs:**
- Using `events.list` to determine available slots
- Requesting `calendar` (full access) scope when only freeBusy is needed for reads
- Event titles/details appearing in server logs

**Phase to address:**
Google Calendar integration phase -- choose the right endpoint from the start.

---

### Pitfall 6: No Buffer Time Between Meetings

**What goes wrong:**
A prospect books the 14:00 slot. Another books 14:30. Enzo now has back-to-back calls with zero transition time. The first call runs 5 minutes over (as calls do), and Enzo joins the second one late, flustered, and unprepared -- the opposite of the "premium" experience the booking page promises.

**Why it happens:**
Naive slot generation: if availability is 14:00-18:00 and slot duration is 30 minutes, the system generates 14:00, 14:30, 15:00... with no gaps. Calendly and similar tools solve this with configurable buffer times, but DIY implementations often skip it.

**How to avoid:**
1. Add a configurable buffer (e.g., 15 minutes) before and/or after each slot.
2. With 30-min slots and 15-min buffer, actual slot generation becomes: 14:00-14:30 (buffer until 14:45), next slot at 14:45 or 15:00.
3. Store buffer as a config value alongside slot duration and availability windows.
4. Also check for existing Google Calendar events + buffer when computing availability (if Enzo has a meeting ending at 13:50, the 14:00 slot should be blocked if buffer is 15 min).

**Warning signs:**
- Slot generation uses only `duration` without `buffer` parameter
- Back-to-back slots visible in the booking UI
- No gap between existing calendar events and offered slots

**Phase to address:**
Core booking logic phase (availability computation).

---

### Pitfall 7: Stale Availability Shown to Prospects

**What goes wrong:**
Prospect opens the booking page, browses slots for a few minutes, then picks one. In the meantime, Enzo added a personal event to his Google Calendar blocking that slot. The prospect submits, and either gets a confusing error or (worse) the booking goes through and double-books Enzo.

**Why it happens:**
Availability is fetched once when the page loads and cached on the client. No mechanism to refresh it. iCal sync between platforms can take 20 minutes to several hours. Even direct Google Calendar API calls reflect a point-in-time snapshot.

**How to avoid:**
1. Re-check availability server-side at booking submission time (not just at page load). This is non-negotiable.
2. Optionally: poll for fresh availability every 60-90 seconds while the prospect is on the page, and gray out slots that become unavailable.
3. Show a clear error message if the selected slot became unavailable: "This slot was just taken. Please choose another." -- not a generic 500 error.
4. Add a timestamp to the availability response so the client knows how fresh the data is.

**Warning signs:**
- No server-side availability recheck at booking time
- Only client-side availability state
- No handling for "slot taken between view and book" scenario
- Generic error messages on booking failure

**Phase to address:**
Core booking logic phase. The double-check at submit time is the minimum; the polling UX can come later.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcoded availability windows in code | Ship faster, no admin UI needed | Every schedule change requires code deploy | MVP only -- add config file or env vars quickly |
| No database, pure Google Calendar as state | Zero DB setup, simpler stack | Can't track booking metadata, analytics, no-shows, or prospect history | Acceptable for v1 if you accept limited analytics |
| Storing refresh token in .env only | Simple, works for single-instance | Token rotation requires redeploy; no audit trail | MVP only -- move to encrypted DB or secret manager |
| No email retry/queue | Simpler code, fewer dependencies | Failed email = prospect never gets confirmation | MVP only -- at minimum log failures and alert |
| Inline availability config (no admin UI) | Ship faster | Enzo must involve a developer to change hours | Acceptable indefinitely for personal tool, but a simple config file helps |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Google Calendar API | Leaving app in "testing" publishing status (tokens expire in 7 days) | Move to "production" in Google Cloud Console before launch |
| Google Calendar API | Polling for changes (wastes quota, stale data) | Use push notifications (webhook) via `watch` endpoint for real-time updates |
| Google Calendar API | Not handling 403/429 rate limit responses | Implement exponential backoff; for this scale (few requests/day) it's unlikely but must be handled |
| Google Calendar API | Requesting full `calendar` scope | Use minimal scopes: `calendar.freebusy` for reads + `calendar.events` for writes |
| Telegram Bot API | Sending notifications synchronously in the booking flow | Fire-and-forget or queue Telegram notifications -- don't let a Telegram outage block booking confirmation |
| Transactional Email (Resend/Postmark) | Not verifying sending domain | Complete DNS verification (SPF, DKIM, DMARC) before sending first email |
| Transactional Email | No fallback when email service is down | Always show booking details on the confirmation screen; email is a bonus, not the only confirmation |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Fetching availability for entire month at once | Slow page load, unnecessary API calls | Fetch one week at a time, load more on scroll/navigation | Not a real concern at Enzo's scale, but good practice |
| No caching of availability between requests | Multiple prospects hitting Google API simultaneously | Cache availability for 30-60 seconds server-side (short TTL to stay fresh) | Unlikely at current scale but prevents quota issues if page gets traffic spike from viral content |
| Google Calendar API cold start on serverless | First request after idle period takes 2-3 seconds | Keep the OAuth client warm or accept the latency; pre-fetch on page load not on slot click | Noticeable UX degradation on serverless cold starts |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Exposing Google Calendar event details in API responses | Leaks Enzo's private schedule, meeting titles, attendee emails | Use freeBusy endpoint (returns only busy/free, no details); never return raw event data to frontend |
| No rate limiting on booking endpoint | Bot or attacker floods Enzo's calendar with fake bookings | Rate limit by IP (e.g., max 3 bookings per IP per hour); add simple CAPTCHA or honeypot field |
| Email field with no validation | Spam bookings with invalid emails waste Enzo's time | Validate email format server-side; optionally verify with a confirmation step (but adds friction) |
| Google API credentials in client-side code | Full calendar access compromised | All Google API calls must happen server-side (API routes); never expose service account keys or OAuth tokens to the browser |
| No CSRF protection on booking form | Cross-site request forgery creating fake bookings | Use CSRF tokens or SameSite cookies on the booking endpoint |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Showing empty week with no available slots | Prospect thinks Enzo is never available; bounces | Auto-advance to the first week with available slots; show "Next available: [date]" |
| No timezone indicator on displayed times | International prospects book at wrong time | Always display timezone: "14:00 (heure de Paris)" |
| Too many slot choices visible at once | Decision paralysis, prospect leaves without booking | Show 1 week at a time; limit visible slots; highlight "soonest available" |
| No confirmation screen or details after booking | Prospect unsure if booking went through | Clear success screen with date, time, timezone, and "you'll receive a confirmation email" |
| Requiring account creation or login to book | Massive friction, most prospects abandon | Name + email only (as already planned) |
| No mobile-optimized slot picker | Tiny tap targets, frustrating on phone | Large, tappable slot buttons; vertical list not calendar grid on mobile |
| Readiness checklist feels like a barrier | Prospect bounces before seeing slots | Keep checklist to 3-4 items max; make it feel like preparation, not gatekeeping |

## "Looks Done But Isn't" Checklist

- [ ] **Availability computation:** Often missing buffer time between slots -- verify slots have gaps
- [ ] **Availability computation:** Often missing cross-calendar check -- verify personal AND work calendar events block slots
- [ ] **Timezone handling:** Often missing DST edge cases -- verify slots around March/October clock changes
- [ ] **Booking confirmation:** Often missing .ics calendar attachment -- verify prospect gets a calendar invite they can add
- [ ] **Email delivery:** Often missing SPF/DKIM/DMARC setup -- verify with mail-tester.com (score 9+/10)
- [ ] **Error states:** Often missing "slot taken" graceful handling -- verify what happens when two people book same slot
- [ ] **Google auth:** Often missing token expiry monitoring -- verify what happens when OAuth token expires
- [ ] **Reminder emails:** Often missing timezone in reminder -- verify reminder shows correct time + timezone
- [ ] **Mobile UX:** Often missing touch-friendly slot selection -- verify booking flow on actual phone
- [ ] **Notification:** Often missing Telegram failure handling -- verify booking completes even if Telegram is down

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Double-booking (race condition) | LOW | Manually cancel one booking, apologize to prospect, offer alternative slot. Add server-side lock to prevent recurrence. |
| OAuth token expired | LOW | Re-authorize via Google OAuth flow; restore from backup token if available. Add monitoring to prevent recurrence. |
| Timezone bug (wrong time booked) | MEDIUM | Contact prospect to reschedule. Audit all recent bookings for same bug. Fix timezone handling and add test cases. |
| Email in spam | LOW | Ask prospect to check spam; resend manually. Fix SPF/DKIM/DMARC. Long-term: warm up sending domain. |
| Stale availability (ghost slot) | LOW | Cancel conflicting event, reschedule prospect. Add server-side recheck at booking time. |
| Fake/spam bookings | MEDIUM | Manually clean up calendar. Add rate limiting and CAPTCHA. Consider email verification step. |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Race condition double-booking | Core booking logic | Load test with 2+ concurrent booking requests for same slot |
| OAuth token expiry | Google Calendar integration | Verify app is in "production" mode; test with expired token; confirm alerting works |
| Timezone display errors | Core booking logic | Book a slot from a different timezone browser; verify Google Calendar event time is correct |
| Email in spam | Email/notifications | Send test emails to Gmail, Outlook, Yahoo; check mail-tester.com score |
| Wrong API endpoint (events.list vs freeBusy) | Google Calendar integration | Code review: confirm freeBusy for availability, events.insert for booking only |
| No buffer between meetings | Core booking logic (availability) | Visual inspection: verify no back-to-back slots offered |
| Stale availability | Core booking logic | Test: add event to Google Calendar while booking page is open, try to book the now-blocked slot |
| Fake/spam bookings | Security hardening (can be post-MVP) | Attempt to book 10 times from same IP in 1 minute; verify rate limit kicks in |
| Mobile UX issues | Frontend/UI | Complete booking flow on iPhone and Android; verify tap targets and readability |
| Telegram notification failure | Notifications | Disable Telegram bot temporarily; verify booking still completes and prospect gets confirmation |

## Sources

- [Google Calendar API FreeBusy endpoint](https://developers.google.com/workspace/calendar/api/v3/reference/freebusy/query) -- official docs on availability checking
- [Google Calendar API quota management](https://developers.google.com/workspace/calendar/api/guides/quota) -- rate limits and best practices
- [Google Calendar API error handling](https://developers.google.com/workspace/calendar/api/guides/errors) -- 403/429 handling
- [Google OAuth2 documentation](https://developers.google.com/identity/protocols/oauth2) -- token lifecycle, refresh token limits
- [Silvermine AI -- Booking System Using Google Calendar](https://www.silvermine.ai/newsletter/booking-system-using-google-calendar-where-it-works-and-where-it-breaks) -- where Google Calendar as booking backend breaks
- [Fixing JavaScript Timezone Issues (Neon)](https://neon.com/blog/fixing-javascript-timezone-issues) -- timezone handling patterns
- [DEV Community -- Handle Date and Time to Avoid Timezone Bugs](https://dev.to/kcsujeet/how-to-handle-date-and-time-correctly-to-avoid-timezone-bugs-4o03) -- UTC storage best practices
- [Debugging Real-Time Bookings (Medium)](https://medium.com/@get2vikasjha/debugging-real-time-bookings-fixing-hidden-race-conditions-cache-issues-and-double-bookings-98328bc52192) -- race conditions and cache issues
- [Postmark -- Transactional Email Best Practices 2026](https://postmarkapp.com/guides/transactional-email-best-practices) -- email deliverability checklist
- [Clearout -- 10 Reasons Transactional Emails Won't Deliver](https://clearout.io/blog/transactional-email-deliverability/) -- common deliverability failures
- [Calendly -- 5 Mistakes to Avoid When Scheduling](https://calendly.com/blog/5-mistakes-you-must-avoid-when-scheduling-online-appointments) -- UX lessons from market leader

---
*Pitfalls research for: Personal booking/scheduling page (CalendlyByEnzo)*
*Researched: 2026-04-05*
