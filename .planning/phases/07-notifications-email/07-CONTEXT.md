# Phase 7: Notifications & Email - Context

**Gathered:** 2026-04-06
**Status:** Ready for planning
**Mode:** Auto-generated (autonomous mode)

<domain>
## Phase Boundary

Telegram notification to Enzo + confirmation email to prospect with .ics calendar file. Both triggered server-side after successful booking in POST /api/book.

</domain>

<decisions>
## Implementation Decisions

### Telegram Notification
- Use raw fetch() to Telegram Bot API — no bot framework needed
- Env vars: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
- Message format: prospect name, email, date/time of booking
- Fire-and-forget: notification failure must NOT break the booking

### Email Confirmation (Brevo)
- Use Brevo (not Resend) — Enzo's existing email service
- API key: stored in BREVO_API_KEY env var
- Sender: contact@remidene-enzo.com, name: "Mini-Coaching Remidene Enzo"
- Email content: date, time, what to expect, how to prepare
- Attach .ics calendar file so prospect can add to their calendar
- Email failure must NOT break the booking

### .ics File Generation
- Generate iCalendar (.ics) file content for the booking
- Include: event title, date/time, duration (30min), description
- Attach as base64 in Brevo API call

### Error Handling
- Both notifications are best-effort — booking succeeds regardless
- Log errors for debugging but don't surface to prospect

### Claude's Discretion
- Exact email HTML template design
- Telegram message formatting (Markdown vs plain text)
- Whether to use Brevo's template system or send raw HTML

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- POST /api/book endpoint (Phase 3) — add notification calls after successful booking
- Brevo API key verified: sender contact@remidene-enzo.com is active

### Integration Points
- Add notification functions to src/lib/notifications/
- Call from POST /api/book after successful calendar event creation
- .ics generation utility in src/lib/calendar/

</code_context>

<specifics>
## Specific Ideas

- Email should match the burnout-quiz brand feel (cream/minimal)
- Telegram message should be concise: just the key info Enzo needs

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>
