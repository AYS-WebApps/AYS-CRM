---
plan: 02-02
audit_date: 2026-03-28
auditor: Claude (Senior Principal Engineer + Compliance Reviewer)
result: CONDITIONALLY_ACCEPTABLE — approved after 4 findings applied
---

# Enterprise Plan Audit Report

**Plan:** .paul/phases/02-client-lead-management/02-02-PLAN.md
**Audited:** 2026-03-28
**Verdict:** Conditionally Acceptable — approved after must-have and strongly-recommended findings applied

---

## 1. Executive Verdict

The plan is structurally sound: inline edit pattern, server actions, not-found handling, and loading/error boundaries are all present and correctly specified. However, three must-have gaps were found that would cause production defects — a stale dashboard count after deletion, a silent no-op on stale sessions, and stale view-mode data violating AC-6. One strongly-recommended UX gap (Escape key in edit mode) rounds out the findings.

**Would I approve this for production as-is?** No. F-03 alone (stale view data post-update) directly breaks AC-6 and would be user-visible on every successful save. Post-fix: yes.

---

## 2. What Is Solid

- **`notFound()` pattern:** Correctly delegated to Next.js — page.tsx calls `notFound()` when `getClient` returns null, which triggers `not-found.tsx` cleanly. No custom error handling needed.
- **Inline edit state machine:** `'view' | 'edit' | 'confirm-delete'` is clean, finite, and correctly scoped to a single Client Component. No prop drilling, no global state.
- **`deleteClient` redirect on server:** Calling `redirect()` in the server action (not client-side) is correct — it prevents the delete button from needing navigation logic, and it handles the redirect atomically with the DB operation.
- **Duplicate email guard on update:** Correctly specified to catch `23505` PostgreSQL error code, consistent with the `addClient` pattern from 02-01.
- **Boundaries protection:** 02-01 server actions locked, Supabase helpers locked, migrations locked. No scope creep vectors left open.

---

## 3. Enterprise Gaps Identified

### G-01: `deleteClient` missing `revalidatePath('/dashboard')` (Must-Have)
After a client is deleted, the `/dashboard` stat card showing "Total clients" reads from Next.js cache. Without revalidating `/dashboard`, the count stays stale until the cache naturally expires or the user navigates away and back. The same issue was found and fixed in 02-01 for `addClient` — this plan had the same omission for `deleteClient`.

### G-02: `updateClient` silent no-op on stale session (Must-Have)
`.from('clients').update({...}).eq('id', id)` with a non-existent `id` returns `{ data: null, error: null }` in Supabase — no error, no rows affected, silent success. In production, a stale browser session (user has the page open, another admin deletes the client) would show a "Saved!" confirmation while nothing was actually persisted. This is a data integrity risk and a confusing UX failure mode. Fix: add `.select('id')` to get returned rows; check if `data.length === 0` to return a user-friendly "Client not found" error.

### G-03: View mode shows stale data after successful update (Must-Have / AC-6 violation)
The plan spec states: "On `{ success }`: transition back to 'view' mode — no state reset needed (revalidatePath refreshes server data on next navigation)." This is incorrect. `revalidatePath` marks the Next.js cache dirty but does NOT push updated props to a mounted Client Component. After saving, `ClientDetail` still holds the original `client` prop from the initial server render. The user sees old values in view mode until they navigate away and back. This directly violates AC-6: "detail page reflects the new values without a full page reload." Fix: call `router.refresh()` on success — this re-runs the Server Component data fetch and passes fresh props to the mounted tree without a full navigation.

### G-04: No Escape key handler in edit mode (Strongly Recommended)
The `CreateClientModal` in 02-01 was given an Escape-to-close handler as a must-have. Edit mode is conceptually equivalent: the user is in a temporary input state and expects Escape to abandon it. Omitting this creates an inconsistency within the same session flow. Fix: `useEffect` listening for `keydown` when `mode === 'edit'`, calling `setMode('view')` on Escape.

---

## 4. Upgrades Applied to Plan

### Must-Have (Release-Blocking)

| # | Finding | Plan Section Modified | Change Applied |
|---|---------|----------------------|----------------|
| F-01 | `deleteClient` missing `revalidatePath('/dashboard')` | Task 1 action spec | Added `revalidatePath('/dashboard')` call before `redirect()` |
| F-02 | `updateClient` silent no-op on 0 rows affected | Task 1 action spec | Added `.select('id')` to update call; added empty-array check returning `{ error: 'Client not found. It may have been deleted.' }` |
| F-03 | Stale view data after update — AC-6 violation | Task 2 action spec | Added `router.refresh()` call on success before `setMode('view')`; added `useRouter` import instruction |

### Strongly Recommended

| # | Finding | Plan Section Modified | Change Applied |
|---|---------|----------------------|----------------|
| F-04 | No Escape key handler in edit mode | Task 2 action spec | Added `useEffect` Escape key listener spec for edit mode, consistent with 02-01 modal pattern |

### Deferred (Can Safely Defer)

| # | Finding | Rationale for Deferral |
|---|---------|------------------------|
| D-01 | "Unsaved changes" navigation guard (beforeunload / Next.js router events) | Adds significant complexity for a team-internal tool. No external users; team members understand the save flow. Address before public-facing release. |
| D-02 | Cascade delete warning ("this will also delete N projects and notes") | Projects and notes don't exist in the UI yet (Phase 3/4). In practice, no cascades will fire in v0.1. Re-evaluate when detail page shows related entities. |

---

## 5. Audit & Compliance Readiness

- **Silent failure prevention:** G-02 fix ensures `updateClient` never reports success on a 0-row update. This is critical for a CRM where a "saved" confirmation that didn't actually save is worse than an error.
- **Post-incident reconstruction:** All server-side errors are logged with timestamp and error code (no PII). This is consistent with the pattern from 02-01. Sufficient for internal tooling.
- **Data integrity:** RLS (`USING (true)`) means any authenticated session can update/delete any client. This is documented as an accepted v0.1 decision. No per-user ownership needed for the internal AYS team.
- **No audit trail for mutations:** No `updated_by` or change log. Deferred per STATE.md (v2 concern). Acceptable for v0.1 internal tool.

---

## 6. Final Release Bar

**Must be true before shipping:**
- F-01, F-02, F-03 applied (all are) ✓
- F-04 applied (is) ✓
- `npm run build` passes
- Human verify checkpoint passes all 16 steps including Escape key test and dashboard count decrement

**Remaining risks after fixes:**
- Cascade deletes (projects/notes) will fire silently when clients are deleted — no warning in UI. Low risk in v0.1 (no projects/notes yet), but will need a warning before Phase 3 ships.

**Sign-off:** With the four findings applied, this plan is production-safe for a v0.1 internal CRM.

---

**Summary:** Applied 3 must-have + 1 strongly-recommended upgrades. Deferred 2 items.
**Plan status:** Updated and ready for APPLY.

---
*Audit performed: 2026-03-28*
