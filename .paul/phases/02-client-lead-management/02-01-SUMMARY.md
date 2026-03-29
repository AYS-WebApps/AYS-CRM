---
phase: 02-client-lead-management
plan: 01
subsystem: ui
tags: [nextjs, react, supabase, tailwind, server-actions, forms]

requires:
  - phase: 01-foundation
    provides: database schema (clients table), Supabase client helpers, auth session, dashboard shell

provides:
  - Client list page at /dashboard/clients with search and empty state
  - addClient / getClients server actions
  - CreateClientModal with full validation and duplicate email handling
  - loading.tsx skeleton and error.tsx boundary for /dashboard/clients
  - SidebarNav client component with active route highlighting
  - Dashboard stat cards now query real data from Supabase

affects: [02-02-client-detail, phase-3-pipeline, phase-4-notes]

tech-stack:
  added: []
  patterns:
    - Server action returns { success: true } | { error: string } — never throws to client
    - useTransition for pending state on form submits (same as login)
    - revalidatePath called for both mutated route AND dashboard (cache coherence)
    - loading.tsx + error.tsx per route (not just global)
    - Client Component owns modal state; Server Component owns data fetch

key-files:
  created:
    - src/app/(dashboard)/dashboard/clients/actions.ts
    - src/app/(dashboard)/dashboard/clients/page.tsx
    - src/app/(dashboard)/dashboard/clients/loading.tsx
    - src/app/(dashboard)/dashboard/clients/error.tsx
    - src/components/clients/ClientList.tsx
    - src/components/clients/CreateClientModal.tsx
    - src/components/layout/SidebarNav.tsx
  modified:
    - src/app/(dashboard)/dashboard/layout.tsx
    - src/app/(dashboard)/dashboard/page.tsx

key-decisions:
  - "addClient (not createClient): avoids TypeScript name collision with Supabase createClient import"
  - "ClientList owns modal state: keeps page.tsx a pure Server Component"
  - "Dashboard page queries live DB counts: hardcoded zeros replaced during verify"

patterns-established:
  - "Server action naming: use domain verb (addClient, not createClient) to avoid import collision"
  - "Route-level loading.tsx + error.tsx: required for every data-fetching route"
  - "revalidatePath both the mutated route and any parent route showing aggregates"
  - "Modal accessibility: Escape key, auto-focus first field, role=dialog + aria-modal"

duration: ~1 session
started: 2026-03-28T00:00:00Z
completed: 2026-03-28T00:00:00Z
---

# Phase 2 Plan 01: Client List + Create Summary

**Client list page, create modal, server actions, loading/error boundaries, and sidebar navigation — fully functional end-to-end.**

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
| AC-1: Clients page accessible | Pass | /dashboard/clients loads, title "Clients" shown |
| AC-2: Empty state shown | Pass | "No clients yet" + "Add your first client" CTA |
| AC-3: Form validates required fields | Pass | Inline error on empty name, no API call made |
| AC-4: Client created successfully | Pass | Modal closes, client appears in list via revalidatePath |
| AC-5: Duplicate email rejected | Pass | "A client with this email already exists." mapped from 23505 |
| AC-6: Client list displays correct data | Pass | Name, phone/—, email/—, source badge, date added |
| AC-7: Search filters clients | Pass | Real-time client-side filter; "No clients match" when empty |
| AC-8: Sidebar navigation works | Pass | Dashboard + Clients links; sky-blue active highlight |
| AC-9: Loading state shown | Pass | Pulse skeleton with header, search, and 5 table row placeholders |

## Accomplishments

- Full create-and-list flow: form validates → server action inserts → revalidatePath refreshes list
- Duplicate email caught at PostgreSQL constraint (23505) and surfaced as user-friendly message
- Modal accessibility: Escape key, auto-focus, role="dialog", aria-modal, aria-labelledby
- Dashboard stat cards now show real counts (total clients + last 30 days) — fixed during verify

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `src/app/(dashboard)/dashboard/clients/actions.ts` | Created | getClients + addClient server actions |
| `src/app/(dashboard)/dashboard/clients/page.tsx` | Created | Server Component — fetches and passes clients to ClientList |
| `src/app/(dashboard)/dashboard/clients/loading.tsx` | Created | Pulse skeleton for data-fetch loading state |
| `src/app/(dashboard)/dashboard/clients/error.tsx` | Created | Error boundary with "Try again" reset button |
| `src/components/clients/ClientList.tsx` | Created | Client Component — list, search, empty state, modal trigger |
| `src/components/clients/CreateClientModal.tsx` | Created | Modal form with validation, useTransition, Escape/focus/ARIA |
| `src/components/layout/SidebarNav.tsx` | Created | Client Component — nav links with usePathname active state |
| `src/app/(dashboard)/dashboard/layout.tsx` | Modified | Replaced nav placeholder with SidebarNav component |
| `src/app/(dashboard)/dashboard/page.tsx` | Modified | Stat cards now query live Supabase counts |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| Renamed server action to `addClient` | `createClient` collides with Supabase helper import in same file — TypeScript error | All future client-mutating actions should use domain verbs |
| ClientList renders page header + modal state | page.tsx must remain a Server Component to call getClients() | Pattern for all future list pages |
| Dashboard page queries DB counts | Hardcoded zeros discovered during human verify checkpoint | Established that dashboard page should always reflect live data |
| Sky-blue active sidebar highlight | Gray-on-white was too subtle for the AYS team to notice | All nav active states use sky-blue going forward |

## Deviations from Plan

### Summary

| Type | Count | Impact |
|------|-------|--------|
| Auto-fixed | 1 | Essential — dashboard was non-functional |
| Scope additions | 0 | — |
| Deferred | 0 | — |

**Total impact:** One essential fix (live dashboard counts), no scope creep.

### Auto-fixed Issues

**1. Dashboard stat cards hardcoded to zero**
- **Found during:** Checkpoint human-verify (step 11)
- **Issue:** `page.tsx` used static `'0'` strings — revalidatePath had no effect
- **Fix:** Added Supabase count queries for total clients and last-30-days clients
- **Files:** `src/app/(dashboard)/dashboard/page.tsx`
- **Verification:** Dashboard showed correct count after adding test client

## Issues Encountered

| Issue | Resolution |
|-------|------------|
| Active sidebar link invisible on white background | Changed active style from `bg-gray-100` to `bg-sky-100 text-sky-700` during verify |

## Next Phase Readiness

**Ready:**
- Client list and create flow fully functional — 02-02 can link rows to a detail page
- `Client` type and `addClient`/`getClients` patterns established for 02-02 to extend
- Sidebar nav is extensible — add new items to `navItems` array in SidebarNav.tsx
- Source badge component pattern (SOURCE_CLASSES/SOURCE_LABELS maps) reusable in detail page

**Concerns:**
- No client detail page yet — client rows are not clickable (expected; scoped to 02-02)

**Blockers:**
- None

---
*Phase: 02-client-lead-management, Plan: 01*
*Completed: 2026-03-28*
