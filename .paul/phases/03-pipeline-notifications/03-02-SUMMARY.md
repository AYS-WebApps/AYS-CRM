---
phase: 03-pipeline-notifications
plan: 02
subsystem: ui
tags: [nextjs, supabase, server-components, tailwind, alerts, pipeline]

requires:
  - phase: 03-01
    provides: projects CRUD, pipeline stage selector, next-action fields on projects

provides:
  - getAlerts() server action — projects with non-null next_action_due_at, sorted ASC
  - getAlertCount() server action — overdue count, returns 0 on error (safe for layout)
  - /dashboard/alerts page — sortable alert list with overdue highlighting
  - Dashboard "Needs Attention" stat card + Pipeline Overview section
  - Sidebar Alerts nav item with live overdue badge count
  - AlertProject type exported from @/lib/types

affects: [phase-04-notes, phase-05-gmail, phase-06-whatsapp]

tech-stack:
  added: []
  patterns:
    - Layout-level async data fetch (getAlertCount) with 0-on-error resilience
    - Promise.all parallel fetching for dashboard page (5 queries in parallel)
    - Two-step cast (as unknown as T) for Supabase embedded relation type inference
    - Conditional Link/div rendering for stat cards with href

key-files:
  created:
    - src/app/(dashboard)/dashboard/alerts/actions.ts
    - src/app/(dashboard)/dashboard/alerts/page.tsx
    - src/app/(dashboard)/dashboard/alerts/loading.tsx
    - src/app/(dashboard)/dashboard/alerts/error.tsx
  modified:
    - src/lib/types/database.ts
    - src/lib/types/index.ts
    - src/app/(dashboard)/dashboard/page.tsx
    - src/app/(dashboard)/dashboard/layout.tsx
    - src/components/layout/SidebarNav.tsx

key-decisions:
  - "getAlertCount returns 0 on error — never throws; used in layout so badge failure must not crash all pages"
  - "Sidebar badge shows overdue-only count; alerts page shows all next-action items (past + future) — asymmetry intentional"
  - "Two-step cast (as unknown as AlertProject[]) to work around Supabase TypeScript inferring embedded relations as arrays"
  - "Dashboard stat cards with href render as <Link>, without href as <div> — consistent clickable-card pattern"

patterns-established:
  - "Layout async data: make DashboardLayout async, fetch badge counts at layout level, pass as props to Client Components"
  - "Error-resilient layout data: functions used in layout must catch errors and return fallback values, never throw"
  - "Supabase FK embed cast: use (data as unknown as T[]) when Supabase infers array for a many-to-one relation"

duration: ~30min
started: 2026-03-29T00:00:00Z
completed: 2026-03-29T00:00:00Z
---

# Phase 3 Plan 02: Dashboard Pipeline Summary + Alerts — Summary

**Alerts page + sidebar badge + dashboard pipeline breakdown delivering full Phase 3 next-action visibility.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~30 min |
| Started | 2026-03-29 |
| Completed | 2026-03-29 |
| Tasks | 2 auto + 1 checkpoint |
| Files modified | 9 |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Alerts page shows projects with next actions | Pass | Sorted by due date ASC, filtered to non-null next_action + next_action_due_at |
| AC-2: Overdue items highlighted red | Pass | `text-red-600` + "— Overdue" label when `due < now` |
| AC-3: Alerts page empty state | Pass | "No next actions scheduled" + "Go to Clients" CTA link |
| AC-4: Sidebar Alerts nav item | Pass | Active highlight (sky-100/sky-700), red badge when overdue count > 0 |
| AC-5: Dashboard Needs Attention card | Pass | Shows overdue count, renders as `<Link>` to /dashboard/alerts, red value when > 0 |
| AC-6: Dashboard pipeline breakdown | Pass | Pipeline Overview section, all 6 stages with counts, hex color badges |

## Accomplishments

- Built `/dashboard/alerts` Server Component: sorted list of all projects with next_action_due_at, overdue highlighted red, empty state with CTA
- Dashboard upgraded from static placeholders to real data: parallel Promise.all for 5 queries, "Needs Attention" card links to alerts, Pipeline Overview shows all 6 stages
- Sidebar Alerts nav item added with live overdue badge (red, capped at 99+), `getAlertCount()` in async layout with 0-on-error resilience so badge never breaks page load
- Audit finding G1 (missing error.tsx) applied — `alerts/error.tsx` added matching project convention

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `src/lib/types/database.ts` | Modified | Added `AlertProject` interface |
| `src/lib/types/index.ts` | Modified | Import + re-export `AlertProject` |
| `src/app/(dashboard)/dashboard/alerts/actions.ts` | Created | `getAlerts()` + `getAlertCount()` server actions |
| `src/app/(dashboard)/dashboard/alerts/page.tsx` | Created | Alerts list page (Server Component) |
| `src/app/(dashboard)/dashboard/alerts/loading.tsx` | Created | Pulse skeleton for alerts route |
| `src/app/(dashboard)/dashboard/alerts/error.tsx` | Created | Error boundary for alerts route |
| `src/app/(dashboard)/dashboard/page.tsx` | Modified | Real pipeline data, Needs Attention card, Pipeline Overview section |
| `src/app/(dashboard)/dashboard/layout.tsx` | Modified | Made async, fetches alertCount, passes to SidebarNav |
| `src/components/layout/SidebarNav.tsx` | Modified | Added `alertCount` prop + Alerts nav item with badge |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| getAlertCount returns 0 on error | Used in layout — badge failure must not crash all dashboard pages | Layout always renders safely |
| Sidebar badge = overdue only; alerts page = all with due date | Urgency (badge) vs. planning (page) are different views | Badge may show 0 while page has future items — intentional |
| Two-step cast `as unknown as AlertProject[]` | Supabase TypeScript infers many-to-one FK embeds as arrays | Clean types without `any` |
| Removed `getAlertCount` import from dashboard page | Dashboard computes needsAttentionCount inline in Promise.all — import would be unused dead code | Cleaner imports (audit finding G2) |

## Deviations from Plan

### Summary

| Type | Count | Impact |
|------|-------|--------|
| Audit additions | 2 | Essential quality fixes |
| Auto-fixed | 1 | TypeScript cast issue |

**Total impact:** Audit findings applied, no scope creep.

### Audit Additions Applied

**1. Missing error.tsx for /dashboard/alerts**
- **Found during:** Audit (G1 — must-have)
- **Issue:** `getAlerts()` throws on DB error; no error boundary means blank/crashed page
- **Fix:** Added `src/app/(dashboard)/dashboard/alerts/error.tsx`
- **Verification:** File exists, matches project pattern

**2. Unused getAlertCount import in dashboard page**
- **Found during:** Audit (G2 — strongly recommended)
- **Issue:** Plan listed import but dashboard uses inline query; unused import is dead code
- **Fix:** Import removed — only `getStages` imported from project-actions
- **Verification:** tsc passes, no unused imports

### Auto-fixed During Execution

**1. TypeScript cast for Supabase embedded relation**
- **Found during:** Task 1 tsc check
- **Issue:** Supabase infers `pipeline_stages` and `clients` as arrays in TS, incompatible with `AlertProject` (single objects)
- **Fix:** Changed `data as AlertProject[]` to `data as unknown as AlertProject[]` with explanatory comment
- **Verification:** `npx tsc --noEmit` passes

## Issues Encountered

| Issue | Resolution |
|-------|------------|
| Supabase TypeScript infers FK embeds as arrays | Two-step cast `as unknown as AlertProject[]` with code comment explaining FK guarantee |

## Next Phase Readiness

**Ready:**
- Phase 3 fully complete — pipeline tracking + next-action alerts delivered
- `AlertProject` type available for any future phase that queries alerts
- Dashboard and sidebar patterns established for future nav items

**Concerns:**
- Delete cascade warning (deferred issue from State.md): deleting a client with projects+alerts will silently remove them — should show "will also delete N projects" before v0.1 ships
- No pagination on alerts page — acceptable for v0.1, revisit if alert count grows large

**Blockers:**
- None

---
*Phase: 03-pipeline-notifications, Plan: 02*
*Completed: 2026-03-29*
