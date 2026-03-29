# Enterprise Plan Audit Report

**Plan:** .paul/phases/03-pipeline-notifications/03-01-PLAN.md
**Audited:** 2026-03-28
**Verdict:** Conditionally Acceptable — 3 must-have issues corrected before this approval

---

## 1. Executive Verdict

Conditionally acceptable. The plan has solid architectural foundations — correct authorization boundaries, established revalidation patterns, well-typed Supabase queries. However, three issues would have caused bugs in production without correction:

1. Silent app invariant violation (null pipeline_stage_id inserted)
2. React state anti-pattern (component shows stale data after mutations)
3. Optional field empty-string pollution in Postgres

All three have been corrected. Two additional UX/reliability improvements applied. Would approve with applied changes.

---

## 2. What Is Solid

- **`.eq('client_id', clientId)` on update and delete** — authorization boundary preventing cross-client writes. Correctly specified on both actions.
- **`.select('id')` on updateProject** — 0-row no-op detection. Established pattern from Phase 2, correctly carried forward.
- **`Promise.all` in page.tsx** — parallel fetch of client, projects, and stages is correct and efficient.
- **`maybeSingle()` for stage resolution** — correct null-safe query pattern established in Phase 2.
- **Stage badge using hex color from DB** — no hardcoded color map, DB-driven rendering. Clean.
- **`router.refresh()` pattern** — consistent with project convention. ClientDetail already proves this works.
- **`revalidatePath` on both detail route and /dashboard** — established in Phase 2, correctly extended.
- **`deleteProject` returns result (not void+redirect)** — correct, component handles UI response.
- **Scope boundaries** — notes and project detail routes explicitly deferred. Appropriate scope discipline.

---

## 3. Enterprise Gaps Identified

### G1 — App Invariant Silent Violation (createProject)
`stage?.id ?? null` fallback allowed insertion with `null` pipeline_stage_id. Per `database.ts` comment: "Projects with NULL pipeline_stage_id are invisible in the pipeline board (Phase 3)." If pipeline_stages is ever misconfigured or the New Lead stage is deleted, projects would silently be created in an invisible/broken state with no user feedback.

### G2 — React useState Anti-Pattern (ProjectsSection)
`useState(initialProjects)` only uses the initializer value on mount. After `router.refresh()`, the Server Component passes fresh `projects` prop to the component tree — but React will NOT re-run the `useState` initializer. The component would continue rendering stale project data (deleted projects still visible, updated stages not reflected). This is a fundamental React behavior, not an edge case. The correct pattern — used by ClientDetail — is to render directly from props.

### G3 — Empty String Stored in Optional DB Fields (updateProject)
`formData.get('event_date')` on a cleared date input returns `""`. Without `|| null` normalization, this empty string would be passed to `.update({ event_date: "" })`. Postgres DATE columns reject empty strings with an error; TEXT columns (next_action) silently store `""`, causing the card to display blank instead of "—". All optional fields need explicit `trim() || null` normalization.

### G4 — editingId / deletingId State Conflict
No specification preventing both `editingId` and `deletingId` from being set on different projects simultaneously. Possible UX state: card A in edit mode, user clicks Delete on card B — card B enters confirm-delete with card A still showing edit form. Mutual exclusion not specified.

### G5 — Timezone-Unsafe Date Parsing for DATE Columns
`new Date('2026-03-28')` is parsed by JavaScript as UTC midnight. In UTC-5 timezone, this renders as "Mar 27". Supabase returns DATE columns as plain `YYYY-MM-DD` strings with no time component. Local parsing requires appending `T00:00:00` to force local-time interpretation.

### G6 — Pending Button Labels Unspecified
`isPending` disabling buttons was specified but not the label changes ("Saving...", "Deleting..."). Prior phases (ClientDetail) explicitly specified these. Omitting them creates UX inconsistency and leaves users without feedback during async operations.

---

## 4. Upgrades Applied to Plan

### Must-Have (Release-Blocking)

| # | Finding | Plan Section Modified | Change Applied |
|---|---------|----------------------|----------------|
| 1 | App invariant violation: null stage_id insert | Task 1, createProject | Added guard: if `!stage?.id` return error, do not proceed with insert |
| 2 | useState anti-pattern: stale project list after refresh | Task 2, ProjectsSection | Removed `projects` local state; render from `projects` prop directly; updated prop name `initialProjects` → `projects` in Task 3 |
| 3 | Empty string stored in optional DB fields | Task 1, updateProject | Added explicit `trim() || null` normalization for all 4 optional fields |

### Strongly Recommended

| # | Finding | Plan Section Modified | Change Applied |
|---|---------|----------------------|----------------|
| 4 | editingId/deletingId mutual exclusion | Task 2, ProjectsSection | Added: setting editingId clears deletingId; setting deletingId clears editingId |
| 5 | Timezone-unsafe date parsing | Task 2, formatDate helper | Updated formatDate: detect DATE strings (no 'T'), append 'T00:00:00' for local parse |
| 6 | Pending button labels unspecified | Task 2, ProjectsSection | Added "Saving...", "Deleting..." pending labels on all mutation buttons |

### Deferred (Can Safely Defer)

| # | Finding | Rationale for Deferral |
|---|---------|------------------------|
| — | None identified for deferral | All findings were must-have or strongly recommended |

---

## 5. Audit & Compliance Readiness

**Silent failure prevention:** G1 fix ensures misconfigured pipeline_stages produces a user-visible error rather than a silently broken project. G3 fix prevents silent DB errors on optional field clearing.

**State integrity:** G2 fix ensures the component always reflects server state after mutations — no stale display that would mislead the AYS team about what's been saved.

**Post-incident reconstruction:** The `revalidatePath` + `router.refresh()` pattern produces a clean server-side audit trail (DB is always the source of truth). No local state manipulation that could diverge from persisted state.

**Authorization boundary:** Both updateProject and deleteProject scope by `client_id` in addition to `project_id`, preventing lateral movement across client records in a shared team environment.

**Ownership:** Server actions named by domain verb, collocated with their route — consistent with established project conventions, maintainable long-term.

---

## 6. Final Release Bar

**Must be true before shipping:**
- All 3 must-have findings applied (done — verified in plan)
- `npx tsc --noEmit` passes
- `npm run build` passes
- `router.refresh()` causes project list to update after create/edit/delete (AC-2, AC-5, AC-6, AC-8)

**Residual risks (acceptable for v0.1 internal tool):**
- `next_action_due_at` timezone interpretation: stored as UTC midnight; team using same timezone will be unaffected
- Single `isPending` across all projects: while one project is mutating, all Edit/Delete buttons are disabled — acceptable UX for a small list

**Sign-off:** Would approve for execution with applied changes. The core data flows are sound, authorization boundaries are correct, and the React rendering pattern now aligns with the established project convention.

---

**Summary:** Applied 3 must-have + 3 strongly-recommended upgrades. Deferred 0 items.
**Plan status:** Updated and ready for APPLY

---
*Audit performed by PAUL Enterprise Audit Workflow*
*Audit template version: 1.0*
