---
phase: 04-notes-system
plan: 01
subsystem: ui
tags: [nextjs, supabase, server-components, tailwind, notes, client-components]

requires:
  - phase: 03-pipeline-notifications
    provides: ProjectsSection component, ClientDetail component, client detail page structure

provides:
  - getNotesByClient() server action — all notes for a client, newest first
  - addNote() server action — insert general or project-specific note with content validation + ownership check
  - deleteNote() server action — dual-key delete (id + client_id) for cross-client safety
  - NotesSection component — reusable add/delete UI for both general and project contexts
  - Two-tier notes on client detail page (general notes after client info, per-project notes inside each project card)

affects: [phase-05-gmail, phase-06-whatsapp]

tech-stack:
  added: []
  patterns:
    - Single-query note fetch (getNotesByClient returns all notes; UI filters by project_id)
    - created_by stores user UUID (not email) — matches UUID FK to auth.users
    - Dual-key delete (.eq('id').eq('client_id')) for cross-client safety
    - projectId ownership check before insert (prevent cross-client note injection)

key-files:
  created:
    - src/app/(dashboard)/dashboard/clients/[id]/note-actions.ts
    - src/components/clients/NotesSection.tsx
  modified:
    - src/app/(dashboard)/dashboard/clients/[id]/page.tsx
    - src/components/clients/ClientDetail.tsx
    - src/components/clients/ProjectsSection.tsx

key-decisions:
  - "created_by stores user.id (UUID), not user.email — DB column is UUID FK to auth.users"
  - "Author display removed from UI — UUID is not human-readable; timestamp is sufficient for v0.1"
  - "General notes placed after client info card, before Projects — user requested this positioning"
  - "Single useTransition shared across add and delete — consistent with ProjectsSection pattern"
  - "Content max 2000 chars enforced server-side and via maxLength on textarea"

patterns-established:
  - "notes.created_by = UUID, not email — any future note display needing author must join auth.users or use a separate name field"
  - "Always use dual-key delete for notes: .eq('id', noteId).eq('client_id', clientId)"
  - "Single-query approach for notes: fetch all by client_id, filter by project_id in component"

duration: ~45min
started: 2026-03-29T00:00:00Z
completed: 2026-03-29T00:00:00Z
---

# Phase 4 Plan 01: Notes System — Summary

**Two-tier append-only notes system: general client notes (after client info) + per-project notes (inside each project card), with inline delete confirmation.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~45 min |
| Started | 2026-03-29 |
| Completed | 2026-03-29 |
| Tasks | 2 auto + 1 checkpoint |
| Files modified | 5 |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Add general client note | Pass | Textarea clears, note at top, button disabled while pending |
| AC-2: Add project-specific note | Pass | Note appears only under that project |
| AC-3: Delete note with confirmation | Pass | Inline amber confirmation before delete |
| AC-4: Notes persist across navigation | Pass | Server Component re-fetch on router.refresh() |
| AC-5: Empty states | Pass | "No notes yet." shown when list is empty |
| AC-6: Notes ordered newest first | Pass | .order('created_at', { ascending: false }) |

## Accomplishments

- Built reusable `NotesSection` component handling both general and project-specific contexts via optional `projectId` prop
- Efficient data flow: single `getNotesByClient` query in `Promise.all` alongside projects/stages; UI filters by `project_id`
- Security: `deleteNote` uses dual-key check; `addNote` verifies `projectId` belongs to `clientId` before insert
- User-requested layout: general notes positioned directly after client info card (before Projects)

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `src/app/(dashboard)/dashboard/clients/[id]/note-actions.ts` | Created | `getNotesByClient`, `addNote`, `deleteNote` server actions |
| `src/components/clients/NotesSection.tsx` | Created | Reusable notes add/list/delete component |
| `src/app/(dashboard)/dashboard/clients/[id]/page.tsx` | Modified | Added `getNotesByClient` to Promise.all, passes `notes` to ClientDetail |
| `src/components/clients/ClientDetail.tsx` | Modified | Added `notes` prop, general NotesSection after client info, notes passed to ProjectsSection |
| `src/components/clients/ProjectsSection.tsx` | Modified | Added `notes` prop, per-project NotesSection in VIEW mode |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| `created_by` stores `user.id` (UUID), not email | DB column is `UUID REFERENCES auth.users(id)` — email string caused FK type error | Author display removed; UUID not human-readable |
| General notes placed after client info, before Projects | User requested this layout — makes general context visible without scrolling past all projects | ClientDetail section order changed |
| Content capped at 2000 chars | Audit finding G1 — prevents unbounded DB inserts | Server + `maxLength` enforcement |
| Delete button always visible (not hover-only) | Audit finding G10 — hover CSS invisible on mobile/touch | Removed `opacity-0 group-hover:opacity-100` |
| projectId ownership verified before insert | Audit finding G3 — prevents cross-client note injection | Extra `.maybeSingle()` ownership query when projectId provided |

## Deviations from Plan

### Summary

| Type | Count | Impact |
|------|-------|--------|
| Bug fix (execution) | 1 | Blocked until fixed |
| User layout request | 1 | Section reordering only |

**Total impact:** One blocking bug fixed, one minor layout adjustment.

### Issues Encountered

**1. `created_by` type mismatch — insert failed**
- **Found during:** Human verify checkpoint ("Failed to add notes")
- **Issue:** Plan specified `user?.email ?? null` for `created_by`, but DB column is `UUID REFERENCES auth.users(id)`. PostgreSQL rejected the text string.
- **Fix:** Changed to `user?.id ?? null`; removed author display from `NotesSection` (UUID is not readable)
- **Verification:** Insert succeeds after fix

**2. General notes placement**
- **Found during:** Human verify — user requested notes appear after client info, not at bottom
- **Fix:** Swapped order in `ClientDetail.tsx` — NotesSection now renders before ProjectsSection
- **Verification:** User confirmed correct placement

## Next Phase Readiness

**Ready:**
- Notes infrastructure complete — future phases can add notes programmatically (e.g. Gmail auto-capture could log the original email as a note)
- `getNotesByClient`, `addNote`, `deleteNote` are stable and importable

**Concerns:**
- Author display is blank for v0.1 — if multi-user author tracking needed later, requires either a `created_by_name TEXT` column addition or a join query to auth.users (admin SDK)
- No note editing — by design (append-only), documented in scope limits

**Blockers:**
- None

---
*Phase: 04-notes-system, Plan: 01*
*Completed: 2026-03-29*
