# Phase 4: Booking Page & Checklist - Context

**Gathered:** 2026-04-06
**Status:** Ready for planning
**Mode:** Auto-generated (autonomous mode)

<domain>
## Phase Boundary

The main booking page: a mini sales page explaining the 30-minute mini-coaching session, followed by a readiness checklist that gates access to the slot picker. This is the prospect-facing entry point — it must feel premium, personal, and convert.

</domain>

<decisions>
## Implementation Decisions

### Page Structure (Progressive Flow)
- Section 1: Sales copy — what the prospect gets from the 30min mini-coaching (clarity on their situation, personalized recommendations, next steps)
- Section 2: Readiness checklist — 3-4 items (30min available, quiet place, ready to talk openly about their situation)
- Section 3: Slot picker (hidden until checklist validated) — built in Phase 5
- The page scrolls naturally from sales → checklist → slots

### Sales Section Design
- Match burnout-quiz aesthetic exactly: cream background, Inter font, minimal, elegant
- Headline: compelling hook about the value of 30 minutes
- 3-4 bullet points of what they'll get
- Subtle, not aggressive — this is coaching, not hard selling
- Personal: use "je" (Enzo speaking) or "vous" (addressing prospect)
- Reference: /Users/Enzo/burnout-quiz/style.css for exact token values

### Checklist UX
- Each item is a clickable card/checkbox
- All items must be checked before the "Voir les créneaux" button activates
- Button is visually disabled (muted) until all checked
- Smooth animation when button becomes active
- Checklist items: 
  1. "J'ai 30 minutes devant moi"
  2. "Je suis dans un endroit calme"
  3. "Je suis prêt(e) à parler ouvertement de ma situation"

### Claude's Discretion
- Exact sales copy wording (within the brief above)
- Animation/transition details
- Component structure

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Tailwind configured with burnout-quiz tokens (bg-bg, text-sub, bg-btn-idle, etc.)
- Inter font loaded in layout.tsx
- Existing page.tsx placeholder to replace

### Established Patterns
- Next.js App Router, server components by default
- Tailwind utility classes for styling

### Integration Points
- Replace src/app/page.tsx with the real booking page
- Phase 5 will add the slot picker component below the checklist

</code_context>

<specifics>
## Specific Ideas

- The page must look like a mini sales page, NOT a cold scheduling tool
- Style must match the burnout quiz exactly
- Prospect sees a recap of what to expect during the 30min coaching

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>
