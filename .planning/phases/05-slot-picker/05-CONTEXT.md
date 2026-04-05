# Phase 5: Slot Picker - Context

**Gathered:** 2026-04-06
**Status:** Ready for planning
**Mode:** Auto-generated (autonomous mode)

<domain>
## Phase Boundary

Date and time selection UI connected to the live /api/slots endpoint. Prospects browse available days and select a specific time slot. Appears after the checklist is validated.

</domain>

<decisions>
## Implementation Decisions

### Layout
- Two-step selection: pick a date → see time slots for that date
- Available dates shown for the next 2 weeks
- Days with no available slots are hidden or grayed out
- Time slots displayed as clickable buttons (e.g., "14:00", "14:30", "15:00")

### UX Flow
- After checklist validation, slot picker slides/fades in
- Dates displayed as a horizontal scrollable list or calendar grid (dates only, not a full month calendar)
- Selecting a date fetches and shows time slots for that day
- Selected time slot is highlighted with accent color
- After selecting a slot, user sees their selection confirmed before the booking form (Phase 6)

### Data
- Fetch slots from GET /api/slots on component mount
- Group slots by date for display
- Loading state while fetching
- Empty state if no slots available

### Claude's Discretion
- Exact date display format (compact calendar vs. date chips)
- Animation/transition details
- Whether to use a single fetch or lazy-load per date

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- GET /api/slots endpoint returns available slots as JSON
- Tailwind tokens configured (bg-bg, text-sub, bg-btn-idle, etc.)
- ChecklistItem component pattern in src/components/

### Integration Points
- Insert slot picker into page.tsx below the checklist section
- Selected slot data will be passed to the booking form (Phase 6)

</code_context>

<specifics>
## Specific Ideas

- Keep it simple and clean — no heavy calendar library
- Match the burnout-quiz minimal aesthetic
- Time slots shown in 24h format (French convention): "14:00", "14:30"

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>
