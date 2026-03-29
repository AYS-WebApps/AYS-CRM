# Enterprise Plan Audit Report

**Plan:** .paul/phases/04-notes-system/04-01-PLAN.md
**Audited:** 2026-03-29
**Verdict:** Conditionally acceptable — 3 findings applied, ready for APPLY

---

## 1. Executive Verdict

**Conditionally acceptable.** The plan is structurally sound with correct security layering on `deleteNote` (dual `id` + `client_id` check), good error object patterns, RLS-protected data access, and consistent project conventions. Three gaps — two must-have and one strongly recommended — were identified and applied before execution. Plan is now ready for APPLY.

---

## 2. What Is Solid

- **`deleteNote` dual-key check** — `.eq('id', noteId).eq('client_id', clientId)` prevents cross-client note deletion. Correct.
- **Single-query note fetch** — `getNotesByClient` fetches all notes (general + project-specific) in one query; filtering happens in UI. Efficient and correct.
- **Error object pattern** — `addNote`/`deleteNote` return `{ error: string }` not throw. Consistent with project pattern.
- **`getNotesByClient` throws on error** — consistent with read-action pattern (getClients, getAlerts). Correct.
- **View-mode-only project notes** — `NotesSection` added only in VIEW branch of ProjectsSection, not in EDIT/CONFIRM-DELETE. Correct.
- **`revalidatePath` scoped to client route** — `/dashboard/clients/${clientId}` is the right scope; alerts and dashboard counts are unaffected by note changes.
- **`created_by` stores user email** — creates audit trail for free using existing Supabase Auth session.
- **Content XSS safety** — `{note.content}` in JSX text node is automatically HTML-escaped by React. `whitespace-pre-wrap` is safe.

---

## 3. Enterprise Gaps Identified

**G1 — Unbounded content length (must-have)**
`addNote` validated non-empty but not max length. PostgreSQL TEXT has no size limit; repeated large inserts are a DoS vector. Layout could break with multi-MB notes despite `break-words`. Risk: data integrity + application availability.

**G3 — projectId ownership not verified before insert (strongly recommended)**
When `projectId` is provided, there was no check that the project belongs to `clientId`. A caller could pass any known project UUID and create a note on a different client's project. For v0.1 team-wide RLS, blast radius is small, but it violates data model integrity.

**G10 — Delete button invisible on touch/mobile (must-have)**
`opacity-0 group-hover:opacity-100` relies on CSS hover state. On iOS/Android touch devices, hover events are unreliable. The AYS team uses mobile devices for daily operations. The delete action would be permanently inaccessible on mobile.

**G2 — No explicit auth check in getNotesByClient (can safely defer)**
`getNotesByClient` queries by `client_id` without verifying caller identity. Covered by Supabase RLS (`USING true`) and proxy.ts auth gate. Safe for v0.1.

**G6 — Client detail loading.tsx has no notes skeleton (can safely defer)**
The existing loading.tsx skeleton was written before notes existed. Notes load in the same Server Component render, so the skeleton shows correctly — it's just missing notes placeholders visually. No functional gap.

**G8 — clientId existence not validated in addNote (can safely defer)**
FK constraint in PostgreSQL rejects insert for non-existent `client_id`. Already handled by `if (error) return { error: ... }`. Safe.

**G9 — Single `useTransition` shared across add and delete (can safely defer)**
Disables both add form and delete buttons when either is pending. Consistent with existing `ProjectsSection` pattern. Brief and low-impact for v0.1.

---

## 4. Upgrades Applied to Plan

### Must-Have (Release-Blocking)

| # | Finding | Plan Section Modified | Change Applied |
|---|---------|----------------------|----------------|
| 1 | G1: Unbounded content length | Task 1 `addNote` action | Added `content.trim().length > 2000` server-side check + `maxLength={2000}` on textarea |
| 2 | G10: Delete button invisible on mobile | Task 1 `NotesSection` render | Removed `opacity-0 group-hover:opacity-100 group` — delete button always visible |

### Strongly Recommended

| # | Finding | Plan Section Modified | Change Applied |
|---|---------|----------------------|----------------|
| 1 | G3: projectId ownership not verified | Task 1 `addNote` action | Added `.maybeSingle()` ownership check before insert when `projectId` provided |

### Deferred (Can Safely Defer)

| # | Finding | Rationale for Deferral |
|---|---------|------------------------|
| 1 | G2: No auth check in getNotesByClient | RLS (`USING true`) + proxy.ts auth gate make unauthenticated access impossible |
| 2 | G6: Loading skeleton missing notes placeholders | Notes load in same Server Component pass; skeleton displays correctly, just without notes-specific shapes |
| 3 | G8: clientId existence not validated | PostgreSQL FK constraint rejects invalid clientId at DB level; error is caught gracefully |
| 4 | G9: Shared useTransition for add and delete | Consistent with project's ProjectsSection pattern; brief pending window |

---

## 5. Audit & Compliance Readiness

- **Audit trail:** `created_by` stores user email on every note. Timestamp via `created_at`. Sufficient for v0.1 team tool.
- **Silent failure prevention:** `addNote`/`deleteNote` return typed error objects; UI surfaces errors inline. No silent no-ops.
- **Post-incident reconstruction:** Note content, author, timestamp, and client/project association are all stored. Adequate for reconstruction.
- **Ownership:** `deleteNote` enforces client-scoped deletes. `addNote` now enforces project-scoped inserts. No cross-client contamination.
- **Input validation:** Content non-empty + max 2000 chars validated server-side. Client-side `maxLength` provides UX defense-in-depth.

---

## 6. Final Release Bar

**Must be true before shipping:**
- Content length capped at 2000 chars (applied ✓)
- Delete button accessible on mobile (applied ✓)
- projectId ownership verified before insert (applied ✓)
- `npx tsc --noEmit` and `npm run build` pass
- Human verify checkpoint approved

**Remaining risks if shipped:**
- No note editing — acceptable per scope, documented
- No pagination on large note lists — acceptable for v0.1 client count
- Shared pending state creates minor UX flicker — low impact

**Sign-off:** Plan is enterprise-acceptable after applied fixes. Scope is appropriately constrained, security controls are layered, error handling is consistent with project standards.

---

**Summary:** Applied 2 must-have + 1 strongly-recommended upgrades. Deferred 4 items.
**Plan status:** Updated and ready for APPLY

---
*Audit performed by PAUL Enterprise Audit Workflow*
*Audit template version: 1.0*
