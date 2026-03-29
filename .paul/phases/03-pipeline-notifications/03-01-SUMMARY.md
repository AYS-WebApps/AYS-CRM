---
phase: 03-pipeline-notifications
plan: 01
subsystem: ui
tags: [nextjs, react, supabase, tailwind, server-actions, pipeline, projects]

requires:
  - phase: 02-client-lead-management/02-02
    provides: Client detail page at /dashboard/clients/[id], getClient action, ClientDetail component

provides:
  - ProjectWithStage type (ProjectRow joined with pipeline_stages name+color)
  - project-actions.ts: getStages, getProjectsByClient, createProject, updateProject, deleteProject
  - ProjectsSection component — inline create/edit/delete for project cards with pipeline stage + next-action
  - CreateProjectModal component — title + event date; auto-assigns New Lead stage on create
  - Client detail page extended to fetch projects + stages (parallel) and render ProjectsSection

affects: [phase-3-02-dashboard, phase-4-notes]

tech-stack:
  added: []
  patterns:
    - ProjectWithStage joined query: select('*, pipeline_stages(name, color)') returns nested stage object
    - Stage badge with DB hex color: style={{ color: hex, backgroundColor: hex + '33' }}
    - Mutual exclusion state: setEditingId clears deletingId and vice versa
    - Timezone-safe DATE display: new Date(dateStr + 'T00:00:00') for YYYY-MM-DD strings
    - Empty-string → null normalization: (trimmed) || null for all optional DB fields
    - App invariant guard: createProject returns error if New Lead stage UUID not found (no null insert)
    - No useState for server-fetched list: ProjectsSection renders from props; router.refresh() drives updates

key-files:
  created:
    - src/app/(dashboard)/dashboard/clients/[id]/project-actions.ts
    - src/components/clients/ProjectsSection.tsx
    - src/components/clients/CreateProjectModal.tsx
  modified:
    - src/lib/types/database.ts
    - src/lib/types/index.ts
    - src/app/(dashboard)/dashboard/clients/[id]/page.tsx
    - src/components/clients/ClientDetail.tsx

key-decisions:
  - "Render ProjectsSection from props (not useState): React doesn't re-run useState initializer on prop change; router.refresh() drives fresh data"
  - "createProject guards null stage UUID: app invariant requires New Lead assignment; error returned rather than inserting invisible project"
  - "Empty string → null normalization in updateProject: DATE column rejects empty string; TEXT fields show blank vs '—'"
  - "editingId/deletingId mutual exclusion: prevents two project cards in different modes simultaneously"
  - "Stage hex color + '33' suffix: 20% opacity background from 8-digit hex — DB-driven, no hardcoded color map"

patterns-established:
  - "Joined Supabase query shape: select('*, relation(fields)') → extend Row type with nested object"
  - "Timezone-safe date: DATE columns need + 'T00:00:00' to parse local, TIMESTAMPTZ uses .toISOString()"
  - "Optional field normalization: all optional FormData fields need trim() || null before DB write"
  - "Component list from props: never useState(initialList) for server-fetched arrays — render from prop, router.refresh() updates"

duration: ~1 session
started: 2026-03-28T00:00:00Z
completed: 2026-03-28T00:00:00Z
---

# Phase 3 Plan 01: Projects + Pipeline + Next-Action on Client Detail Summary

**Projects section shipped on client detail — AYS team can now attach events/bookings to any client, assign pipeline stages, and record next actions with due dates, all inline on the client page.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | 1 session |
| Started | 2026-03-28 |
| Completed | 2026-03-28 |
| Tasks | 3 completed (2 auto + 1 checkpoint) |
| Files created/modified | 7 |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Projects section visible on client detail | Pass | Section renders below client info card with empty state + Add Project button |
| AC-2: Create project — happy path | Pass | Modal creates project; New Lead stage auto-assigned; list updates via router.refresh() |
| AC-3: Create project — title required | Pass | Client-side validation before server call; "Title is required." inline error |
| AC-4: Project card shows correct data | Pass | Title, event date, stage badge (colored), next action, due date — all display correctly |
| AC-5: Edit project — pipeline stage | Pass | Stage select updates badge on save; hex color from DB |
| AC-6: Edit project — next action | Pass | next_action + next_action_due_at saved and displayed on card |
| AC-7: Edit project — title and event date | Pass | Both fields editable and reflected on save |
| AC-8: Delete project with confirmation | Pass | Inline red banner → Confirm Delete → project removed; router.refresh() updates list |
| AC-9: Cancel project edit reverts | Pass | Cancel returns to view mode; defaultValue fields show original values |

## Accomplishments

- Full project lifecycle on client detail: create → view → edit (stage + next-action + title) → delete
- App invariant honored: `createProject` resolves New Lead UUID before insert; returns error if not found
- Three audit-applied patterns established: null-guard on stage, empty-string normalization, props-not-state for list rendering
- Stage badges are fully DB-driven — hex color from `pipeline_stages.color` field, no hardcoded map
- `ProjectsSection` correctly uses `router.refresh()` as sole data update mechanism (no local state for project list)

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `src/lib/types/database.ts` | Modified | Added `ProjectWithStage` interface (ProjectRow + pipeline_stages nested shape) |
| `src/lib/types/index.ts` | Modified | Exported `ProjectWithStage` |
| `src/app/(dashboard)/dashboard/clients/[id]/project-actions.ts` | Created | 5 server actions: getStages, getProjectsByClient, createProject, updateProject, deleteProject |
| `src/app/(dashboard)/dashboard/clients/[id]/page.tsx` | Modified | Parallel fetch (Promise.all) for client + projects + stages; passes all to ClientDetail |
| `src/components/clients/ClientDetail.tsx` | Modified | Added projects + stages props; renders ProjectsSection below client info |
| `src/components/clients/ProjectsSection.tsx` | Created | Client Component: project card list, inline edit/delete, mutual exclusion state |
| `src/components/clients/CreateProjectModal.tsx` | Created | Modal: title (required) + event date; auto-assigns New Lead on create |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| No `useState` for project list in ProjectsSection | React's useState initializer only runs on mount — `useState(initialProjects)` wouldn't update after `router.refresh()`. Props-driven rendering is the correct pattern, consistent with ClientDetail | All future list components should render from props, not local state |
| `createProject` returns error if New Lead stage null | App invariant: null pipeline_stage_id makes projects invisible in pipeline board (per database.ts). Error is better than silent data corruption | Pattern: always guard app invariants at the action layer, not the component |
| Empty string → null normalization at action layer | Empty date input returns `""` which errors on DATE column; empty text fields store `""` vs NULL — different display behavior | All optional FormData fields need `trim() \|\| null` before DB write |
| `editingId`/`deletingId` mutual exclusion | Without it, two project cards could be in different modes simultaneously — confusing UX | Pattern: independent mode states need mutual exclusion when cards share a list |

## Deviations from Plan

### Summary

| Type | Count | Impact |
|------|-------|--------|
| Audit fixes pre-applied | 6 | All incorporated cleanly — no runtime issues |
| Scope additions | 0 | — |
| Deferred | 0 | — |

**Total impact:** Zero execution deviations — audit findings were applied to plan before execution, resulting in a clean first-pass build.

## Issues Encountered

None.

## Next Phase Readiness

**Ready:**
- `getProjectsByClient(clientId)` available for 03-02 dashboard queries
- `next_action` + `next_action_due_at` on projects — Phase 3-02 can query overdue/upcoming actions
- `pipeline_stage_id` on all projects — Phase 3-02 can aggregate counts per stage for dashboard summary
- `ProjectWithStage` type available for any Phase 3-02 components that list projects
- `getStages()` action available for any Phase 3-02 filtering/grouping by stage

**Concerns:**
- Delete warning on client detail still doesn't mention cascade effects (deleting a client deletes all their projects + notes) — noted as deferred issue from Phase 2; becomes more urgent now that real project data can be lost

**Blockers:**
- None

---
*Phase: 03-pipeline-notifications, Plan: 01*
*Completed: 2026-03-28*
