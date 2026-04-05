# Phase 6: Booking Submission - Context

**Gathered:** 2026-04-06
**Status:** Ready for planning
**Mode:** Auto-generated (autonomous mode)

<domain>
## Phase Boundary

Booking form, submission to POST /api/book with race condition protection, and confirmation screen. The final step of the prospect-facing flow.

</domain>

<decisions>
## Implementation Decisions

### Booking Form
- Fields: Prénom (first name) + Email
- Minimal — no long forms, no account creation
- Zod validation on client and server
- Show selected slot summary above the form
- Submit button: "Confirmer mon créneau"

### Submission Flow
- POST /api/book with { name, email, startTime, endTime }
- Show loading state during submission
- On success: display confirmation screen
- On 409 (conflict): show "Ce créneau vient d'être réservé" with option to pick another slot
- On error: show generic error message with retry option

### Confirmation Screen
- Replace the form with a success message
- Show: date, time, what to expect during the call
- Reassuring tone: "À bientôt !" etc.
- Checkmark animation or icon

### Claude's Discretion
- Exact confirmation screen layout
- Form validation error display style
- Animation details

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- POST /api/book endpoint already built (Phase 3)
- Selected slot state in page.tsx (from Phase 5)
- Tailwind tokens for styling

### Integration Points
- BookingForm component receives selectedSlot from page.tsx state
- On successful booking, transition from form to confirmation view
- Phase 7 will add email/Telegram notifications (triggered server-side in /api/book)

</code_context>

<specifics>
## Specific Ideas

- Keep the form dead simple: just name and email
- Confirmation should feel warm and personal

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>
