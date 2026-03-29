# Project State

## Project Reference

See: .paul/PROJECT.md (updated 2026-03-28)

**Core value:** The AYS team can track every lead and client through the pipeline, know exactly what needs to happen next, and never miss a new inquiry — whether it comes from the website, email, or WhatsApp.
**Current focus:** Phase 5 — Gmail Auto-Capture

## Current Position

Milestone: v0.1 Initial Release
Phase: 5 of 6 (Gmail Auto-Capture) — In progress
Plan: 05-01 (Gmail OAuth2 + Settings UI) — Audited, ready to apply
Status: PLAN + AUDIT complete
Last activity: 2026-03-29 — 05-01 audited, 3 must-have + 1 strongly-recommended fixes applied

Progress:
- Milestone: [██████░░░░] 67%
- Phase 5: [██░░░░░░░░] 20%

## Loop Position

Current loop state:
```
PLAN ──▶ APPLY ──▶ UNIFY
  ✓        ○        ○     [05-01 planned — run /paul:audit or /paul:apply]
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
- **Server action naming:** Use domain verb to avoid import collision (addClient not createClient)
- **Active nav style:** sky-100/sky-700 (not gray — too subtle on white sidebar)
- **revalidatePath scope:** Always revalidate both mutated route AND parent dashboard route
- **Single-row queries:** Use `.maybeSingle()` not `.single()` — avoids fragile PGRST116 error code check
- **Post-mutation refresh:** Call `router.refresh()` after update actions so Server Component re-fetches props
- **Deep-link UI state:** Use searchParams (e.g. `?edit=1`) + `initialMode` prop for URL-driven component state
- **Update guard:** Always `.select('id')` on update calls to detect 0-row no-ops (stale session protection)

### Deferred Issues
- CSP headers — requires content inventory; address before production deploy
- Soft deletes — hard CASCADE accepted for v0.1; address before multi-user version
- `updated_by` on notes — v2 concern
- Schema migration versioning (Supabase CLI) — address at Phase 5+ when schema complexity increases
- Delete warning for cascade effects — needs "will also delete N projects/notes" before Phase 3/4 ship data

### Blockers/Concerns
None.

### Git State
Last commit: (after phase 3 commit)
Branch: master

## Session Continuity

Last session: 2026-03-29
Stopped at: 05-01 audited — CSRF fix, auth gate, error message, loading skeleton applied
Next action: /paul:apply for 05-01
Resume file: .paul/phases/05-gmail-auto-capture/05-01-PLAN.md

---
*STATE.md — Updated after every significant action*
