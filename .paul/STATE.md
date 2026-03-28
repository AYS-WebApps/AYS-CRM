# Project State

## Project Reference

See: .paul/PROJECT.md (updated 2026-03-28)

**Core value:** The AYS team can track every lead and client through the pipeline, know exactly what needs to happen next, and never miss a new inquiry — whether it comes from the website, email, or WhatsApp.
**Current focus:** Phase 2 — Client & Lead Management

## Current Position

Milestone: v0.1 Initial Release
Phase: 2 of 6 (Client & Lead Management) — Not started
Plan: Not started
Status: Ready to plan Phase 2
Last activity: 2026-03-28 — Phase 1 complete. Auth + database schema shipped and verified.

Progress:
- Milestone: [██░░░░░░░░] 17%
- Phase 2: [░░░░░░░░░░] 0%

## Loop Position

Current loop state:
```
PLAN ──▶ APPLY ──▶ UNIFY
  ○        ○        ○     [Ready to plan Phase 2]
```

## Accumulated Context

### Decisions
- Stack: Next.js 16 App Router + Supabase + Vercel (upgraded from 14 to fix DoS vulns)
- Auth: Supabase Auth with @supabase/ssr (not deprecated auth-helpers)
- Proxy convention: `src/proxy.ts` with `export async function proxy()` — Next.js 16 breaking change
- Route structure: dashboard routes at `src/app/(dashboard)/dashboard/` — route groups don't add to URL
- Supabase project: avcyvtptrdnzvupitbaz.supabase.co
- Two-tier notes: nullable `project_id` on notes table — NULL = general, NOT NULL = project-specific
- Hard CASCADE deletes for v0.1 — no soft deletes
- Team-wide RLS (USING true) — no per-user isolation in v0.1
- **App invariant:** New projects MUST always set `pipeline_stage_id` to 'New Lead' stage UUID at insert time

### Deferred Issues
- CSP headers — requires content inventory; address before production deploy
- Soft deletes — hard CASCADE accepted for v0.1; address before multi-user version
- `updated_by` on notes — v2 concern
- Schema migration versioning (Supabase CLI) — address at Phase 5+ when schema complexity increases

### Blockers/Concerns
None.

### Git State
No git repo initialized yet — run `git init` before Phase 2.

## Session Continuity

Last session: 2026-03-28
Stopped at: Phase 1 complete (both plans unified)
Next action: Run /paul:plan for Phase 2 (Client & Lead Management)
Resume file: .paul/ROADMAP.md

---
*STATE.md — Updated after every significant action*
