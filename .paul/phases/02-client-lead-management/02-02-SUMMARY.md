---
phase: 02-client-lead-management
plan: 02
subsystem: ui
tags: [nextjs, react, supabase, tailwind, server-actions, dynamic-route]

requires:
  - phase: 02-client-lead-management/02-01
    provides: Client type, addClient/getClients actions, ClientList component, source badge constants

provides:
  - Client detail page at /dashboard/clients/[id]
  - Inline edit form with validation (name, phone, email, source)
  - Delete with inline confirmation
  - getClient / updateClient / deleteClient server actions
  - not-found, loading, error route files for /dashboard/clients/[id]
  - Edit button on every list row (navigates to detail page in edit mode)

affects: [phase-3-pipeline, phase-4-notes]

tech-stack:
  added: []
  patterns:
    - maybeSingle() for nullable single-row queries (not single() — avoids PGRST116 code dependency)
    - router.refresh() after mutation to re-fetch Server Component props without navigation
    - searchParams ?edit=1 to initialize Client Component mode from URL
    - updateClient uses .select('id') to detect 0-row-affected silent no-ops
    - deleteClient revalidates /dashboard so stat counts stay accurate

key-files:
  created:
    - src/app/(dashboard)/dashboard/clients/[id]/actions.ts
    - src/app/(dashboard)/dashboard/clients/[id]/page.tsx
    - src/app/(dashboard)/dashboard/clients/[id]/loading.tsx
    - src/app/(dashboard)/dashboard/clients/[id]/error.tsx
    - src/app/(dashboard)/dashboard/clients/[id]/not-found.tsx
    - src/components/clients/ClientDetail.tsx
  modified:
    - src/components/clients/ClientList.tsx
    - src/app/(dashboard)/dashboard/clients/[id]/page.tsx (searchParams support)

key-decisions:
  - "maybeSingle() over single(): avoids fragile PGRST116 error code check for not-found"
  - "?edit=1 searchParam: lets list Edit button deep-link directly into edit mode"
  - "Edit button on list rows: discoverability improvement requested during verify checkpoint"
  - "router.refresh() on save: re-fetches server data so view mode shows updated values immediately"

patterns-established:
  - "Dynamic route not-found: page.tsx calls notFound() when action returns null"
  - "Deep-link to component mode: pass initialMode prop from searchParams for URL-driven UI state"
  - "0-row guard on update: always .select('id') and check data.length to catch stale-session edits"

duration: ~1 session
started: 2026-03-28T00:00:00Z
completed: 2026-03-28T00:00:00Z
---

# Phase 2 Plan 02: Client Detail + Edit + Delete Summary

**Dynamic client detail page with inline edit, delete-with-confirmation, not-found handling, and direct Edit access from the list — completing Phase 2.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | 1 session |
| Started | 2026-03-28 |
| Completed | 2026-03-28 |
| Tasks | 4 completed (3 auto + 1 checkpoint) |
| Files created/modified | 9 |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Client row is clickable | Pass | Name links to detail; Edit button links directly to edit mode |
| AC-2: Detail page shows correct data | Pass | Name, phone/—, email/—, source badge, date added, back link |
| AC-3: Unknown ID handled | Pass | notFound() → not-found.tsx ("Client not found." + back link) |
| AC-4: Edit form pre-populated | Pass | defaultValue from client prop; ?edit=1 param opens edit mode directly |
| AC-5: Edit validates before saving | Pass | Inline name required + email format errors, no API call |
| AC-6: Update saves successfully | Pass | router.refresh() re-fetches server data; view mode shows new values immediately |
| AC-7: Duplicate email on update rejected | Pass | 23505 → "A client with this email already exists." |
| AC-8: Delete with confirmation | Pass | Inline red banner → Confirm Delete → redirect to list |
| AC-9: Cancel edit reverts changes | Pass | setMode('view') discards; Escape key also exits edit mode |

## Accomplishments

- Full client lifecycle complete: list → view detail → edit → delete
- `maybeSingle()` pattern established as the correct approach for nullable single-row queries
- `router.refresh()` pattern established for post-mutation data refresh without navigation
- Edit button on list rows added during verify checkpoint — discoverability improvement
- `?edit=1` searchParam allows deep-linking directly into edit mode from any context

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `src/app/(dashboard)/dashboard/clients/[id]/actions.ts` | Created | getClient, updateClient, deleteClient server actions |
| `src/app/(dashboard)/dashboard/clients/[id]/page.tsx` | Created | Server Component — fetches client, handles not-found, passes searchParams |
| `src/app/(dashboard)/dashboard/clients/[id]/loading.tsx` | Created | Pulse skeleton for detail route |
| `src/app/(dashboard)/dashboard/clients/[id]/error.tsx` | Created | Error boundary with "Try again" for detail route |
| `src/app/(dashboard)/dashboard/clients/[id]/not-found.tsx` | Created | "Client not found." with back link |
| `src/components/clients/ClientDetail.tsx` | Created | Client Component — view/edit/confirm-delete state machine |
| `src/components/clients/ClientList.tsx` | Modified | Added Edit link on each row; added empty header cell for action column |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| `maybeSingle()` instead of `single()` | `.single()` returns PGRST116 error when no rows found — fragile to rely on error codes; `.maybeSingle()` returns `null` data cleanly | All future single-row queries should use maybeSingle() |
| `router.refresh()` after update | `revalidatePath` marks cache dirty but doesn't push new props to mounted component — view mode showed stale data without refresh | Pattern for all future inline edit components |
| Edit button on list with `?edit=1` | User feedback during verify: wanted edit accessible without navigating to detail first | `initialMode` prop pattern reusable for any future deep-link UI state |
| `updateClient` uses `.select('id')` | Guards against silent 0-row no-op when client deleted mid-session | Applied to all future update actions |

## Deviations from Plan

### Summary

| Type | Count | Impact |
|------|-------|--------|
| Live fixes | 2 | Both essential — not-found broken, edit discoverability |
| Scope additions | 1 | Edit button on list row (user-requested during verify) |

**Total impact:** Essential fixes + one small UX improvement, no scope creep.

### Live Fixes

**1. `single()` → `maybeSingle()` for getClient**
- Found during: Checkpoint verify (step 6 — not-found page unreachable)
- Issue: `.single()` may return different error codes depending on Supabase version; `PGRST116` check was unreliable
- Fix: Replaced with `.maybeSingle()` which returns `null` data (no error) on 0 rows
- Files: `src/app/(dashboard)/dashboard/clients/[id]/actions.ts`

**2. Edit button on list rows + `?edit=1` deep link**
- Found during: Checkpoint verify (user requested discoverability improvement)
- Issue: Clicking client name → detail page → finding Edit button was non-obvious
- Fix: Added "Edit" link on each row navigating to `/dashboard/clients/[id]?edit=1`; page.tsx reads searchParams and passes `initialMode` to ClientDetail
- Files: `ClientList.tsx`, `page.tsx`, `ClientDetail.tsx`

## Next Phase Readiness

**Ready:**
- Client detail page at /dashboard/clients/[id] is Phase 3's home base for pipeline stage selector
- `getClient(id)` available for Phase 3 to extend with project/pipeline data
- `updateClient` pattern established — Phase 3 can add pipeline_stage_id update action
- Detail page has clear extension points for Phase 4 notes section

**Concerns:**
- Delete warning doesn't mention cascade effects (projects, notes) — needs updating before Phase 3/4 ship data that users could accidentally lose

**Blockers:**
- None

---
*Phase: 02-client-lead-management, Plan: 02*
*Completed: 2026-03-28*
