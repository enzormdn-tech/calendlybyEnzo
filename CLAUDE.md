<!-- GSD:project-start source:PROJECT.md -->
## Project

**CalendlyByEnzo**

A personal booking page for discovery calls (30min coaching sessions). Prospects land on the page, complete a readiness checklist, pick an available slot based on Enzo's defined availability and Google Calendar, and book. Enzo gets notified via Telegram and manages bookings through the Enzo OS dashboard.

**Core Value:** A prospect can book a discovery call in under 2 minutes — no friction, no back-and-forth, no third-party branding.

### Constraints

- **Stack**: To be determined by research — likely Next.js given Enzo OS ecosystem
- **Auth**: No prospect auth needed — booking is anonymous (name + email only)
- **Calendar**: Google Calendar API for availability checking and event creation
- **Notifications**: Telegram Bot API for instant notifications to Enzo
- **Email**: Transactional email service for confirmation + reminder
- **Domain**: remidene-enzo (Squarespace domain, DNS pointed to Vercel)
- **Hosting**: Vercel (deployment config in Phase 1 or first deploy)
- **Design**: Cream/light theme (burnout-quiz style: #fafaf8 bg, #1c1c1c text, Inter 300/400), minimalist, mobile-first
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Recommended Stack
### Core Technologies
| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | 15.x (LTS) | Full-stack framework | App Router + API routes in one project. v15 is proven stable, v16 exists but v15 is safer for a small personal tool that doesn't need Turbopack speed. Deployed on Vercel with zero config. |
| TypeScript | 5.x | Type safety | Non-negotiable for any Next.js project. Catches Google Calendar API shape errors at compile time. |
| React | 19.x | UI framework | Ships with Next.js 15. Server Components reduce client bundle for a mostly-static booking page. |
| Tailwind CSS | 4.x | Styling | Fast iteration on dark theme. Enzo's brand tokens (`#0f0f0f`, Inter font) map directly to Tailwind config. No CSS-in-JS runtime cost. |
### Database
| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Turso (libSQL) | latest | Persistent storage for bookings, availability config | SQLite-compatible but cloud-hosted -- works on Vercel serverless (better-sqlite3 does NOT work on Vercel). Free tier is generous (500 databases, 9GB storage). Single URL change from local dev to prod. |
| Drizzle ORM | 0.40+ | Type-safe SQL queries, schema, migrations | Lightweight (~7.4kb), SQL-like syntax (no magic), first-class Turso/libSQL support. Better fit than Prisma for a small schema (bookings, availability_windows, settings). |
### External Services
| Service | Purpose | Why Recommended |
|---------|---------|-----------------|
| Google Calendar API (googleapis) | Check availability, create events | Official Google SDK. OAuth2 for Enzo's single account (service account or refresh token). The source of truth for conflicts. |
| Resend | Transactional emails (confirmation + reminder) | Best DX for Next.js: native React Email integration, TypeScript SDK, 100 emails/day free (more than enough for discovery calls). Modern API, no legacy bloat. |
| React Email | Email templates | Build confirmation/reminder emails as React components. Renders to HTML. Maintained by Resend team. |
| Telegram Bot API (direct fetch) | Notify Enzo on new booking | For sending a single notification, a raw `fetch()` to `api.telegram.org/bot<token>/sendMessage` is simpler than any library. No bot framework needed -- Enzo isn't building an interactive bot. |
### Supporting Libraries
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | 4.x | Date manipulation (formatting, adding intervals) | General date math: computing slots, formatting display dates. Tree-shakeable, only import what you use. |
| date-fns-tz | 3.x | Timezone handling | Converting between Enzo's timezone and prospect's timezone. Required for correct slot display across timezones. |
| @libsql/client | latest | Turso database driver | Required by Drizzle ORM for Turso connection. |
| @react-email/components | 1.x | Pre-built email components | Buttons, headings, sections for confirmation/reminder emails. |
| resend | 6.x | Resend Node.js SDK | Sending emails from API routes. |
| googleapis | 144+ | Google APIs client | Google Calendar API calls (freebusy, events.insert). |
| zod | 3.x | Schema validation | Validate booking form input (name, email) and API responses. |
### Development Tools
| Tool | Purpose | Notes |
|------|---------|-------|
| drizzle-kit | Schema migrations, studio | `drizzle-kit push` for dev, `drizzle-kit migrate` for prod. Studio gives a GUI for inspecting bookings. |
| Vercel CLI | Local dev + deployment | `vercel dev` mirrors production env (serverless, env vars). |
## Installation
# Core framework
# Database
# Google Calendar
# Email
# Validation
# Date handling
# Dev dependencies
## Alternatives Considered
| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Next.js 15 | Next.js 16 | If you need Turbopack default builds or cache components. Not worth the risk for a small booking page. |
| Turso + Drizzle | Vercel Postgres + Prisma | If you already pay for Vercel Pro and want managed Postgres. Overkill for a bookings table. |
| Turso + Drizzle | Supabase | If you need auth, real-time, or a dashboard UI out of the box. Adds unnecessary complexity here. |
| Resend | Postmark | If deliverability is mission-critical (password resets, OTPs). For booking confirmations, Resend's DX wins. |
| Resend | Nodemailer + Gmail SMTP | If you want zero cost and accept Gmail rate limits (500/day). Fragile: Google can revoke app passwords. |
| date-fns + date-fns-tz | Luxon | If the app were timezone-heavy (multi-timezone team scheduling). For a single-coach booking page, date-fns is lighter and tree-shakeable. |
| Raw fetch (Telegram) | grammY / Telegraf | If building an interactive Telegram bot. For one-way notifications, a library is unnecessary overhead. |
| Tailwind CSS 4 | shadcn/ui | Add shadcn/ui ON TOP of Tailwind if you want pre-built UI components (buttons, dialogs, calendar picker). Good complement, not a replacement. |
## What NOT to Use
| Avoid | Why | Use Instead |
|-------|-----|-------------|
| better-sqlite3 | Does NOT work on Vercel serverless (needs persistent filesystem). Will fail silently in production. | Turso (libSQL) -- cloud SQLite, works everywhere. |
| Prisma | Heavy client generation step, large bundle (~1MB+), overkill for 3-4 tables. Cold starts are slower on serverless. | Drizzle ORM -- 7.4kb, no generation step, SQL-like. |
| SendGrid | Free plan retired (May 2025). Legacy API patterns, expensive. | Resend -- modern, free 100 emails/day, React Email native. |
| Moment.js | Deprecated, massive bundle (330kb). | date-fns -- modular, tree-shakeable, actively maintained. |
| node-telegram-bot-api / Telegraf | Full bot frameworks with polling, middleware, webhook handlers. Massive overkill for sending one message. | Direct `fetch()` to Telegram Bot API -- 5 lines of code. |
| NextAuth.js / Auth.js | No user auth needed. This is a single-coach tool with anonymous booking. Adding auth adds login flows, sessions, database tables for nothing. | Simple env-var protection for admin routes if needed. |
| Calendly embed / Cal.com embed | Defeats the purpose. Third-party branding, no control, dependency on external service. | Build your own -- the whole point is a branded, personal experience. |
## Stack Patterns by Variant
- Use Turso for database (cloud SQLite, serverless-compatible)
- Use Vercel Cron for reminder emails (trigger 1h before each booking)
- Use Vercel environment variables for all secrets (Google OAuth, Telegram token, Resend key, Turso URL)
- Could use better-sqlite3 instead of Turso (persistent filesystem available)
- Use node-cron for reminder scheduling instead of Vercel Cron
- Use Caddy/nginx for HTTPS termination
## Version Compatibility
| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| Next.js 15.x | React 19.x, Tailwind 4.x | Ships together via create-next-app |
| Drizzle ORM 0.40+ | @libsql/client latest | Both actively maintained, Turso integration is first-class |
| Resend 6.x | React Email 5.x, @react-email/components 1.x | Same team maintains both, designed to work together |
| date-fns 4.x | date-fns-tz 3.x | tz package is the official timezone companion |
## Key Architecture Decision: Google Calendar Auth
## Sources
- [Next.js Blog](https://nextjs.org/blog) -- confirmed v15 LTS status, v16 release timeline (HIGH confidence)
- [Vercel SQLite KB](https://vercel.com/kb/guide/is-sqlite-supported-in-vercel) -- confirmed better-sqlite3 incompatibility (HIGH confidence)
- [Turso + Drizzle Docs](https://docs.turso.tech/sdk/ts/orm/drizzle) -- integration guide (HIGH confidence)
- [Google Calendar API Node.js Quickstart](https://developers.google.com/workspace/calendar/api/quickstart/nodejs) -- googleapis setup (HIGH confidence)
- [Resend NPM](https://www.npmjs.com/package/resend) -- v6.10.0, 383 dependents (HIGH confidence)
- [React Email](https://react.email) -- v5.2.10, component library (HIGH confidence)
- [PkgPulse: date-fns vs Day.js vs Luxon 2026](https://www.pkgpulse.com/blog/best-javascript-date-libraries-2026) -- timezone comparison (MEDIUM confidence)
- [npm trends: grammY vs Telegraf](https://npmtrends.com/grammy-vs-node-telegram-bot-api-vs-telegraf-vs-telegram-bot-api) -- Telegram library downloads (MEDIUM confidence)
- [Drizzle vs Prisma 2026](https://www.bytebase.com/blog/drizzle-vs-prisma/) -- ORM comparison (MEDIUM confidence)
- [Knock: Top Transactional Email Services 2026](https://knock.app/blog/the-top-transactional-email-services-for-developers) -- email provider comparison (MEDIUM confidence)
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, or `.github/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
