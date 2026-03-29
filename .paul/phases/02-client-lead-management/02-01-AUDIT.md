---
plan: 02-01
audit_date: 2026-03-28
auditor: Claude (Senior Principal Engineer + Compliance Reviewer)
result: APPROVED_WITH_CHANGES
---

# Audit Report — Plan 02-01: Client & Lead Management

## Summary

Plan 02-01 is well-scoped and follows the patterns established in Phase 1. 6 findings were identified: 3 must-have (compile error, missing loading state, missing error boundary) and 3 strongly-recommended (cache coherence, accessibility, UX). All have been applied to the plan. 3 issues deferred as out of scope for v0.1.

**Result: APPROVED — all must-have and strongly-recommended findings applied.**

---

## Section 1 — Naming / Identifier Conflicts

### F-01: `createClient` naming collision — MUST-HAVE ✅ APPLIED

**Finding:** Task 1 defines a server action named `createClient(formData)` in the same file that imports `createClient` from `@/lib/supabase/server`. This is a TypeScript identifier collision — the local export shadows the import, causing a compile error that would fail `npx tsc --noEmit`.

**Risk:** The build will not compile. This is a hard blocker.

**Fix applied:** Server action renamed from `createClient` to `addClient` throughout the plan (action spec, modal call site, output section).

---

## Section 2 — Error Handling / Resilience

### F-02: No `loading.tsx` for /dashboard/clients route — MUST-HAVE ✅ APPLIED

**Finding:** CLAUDE.md convention explicitly requires loading states: "always handle loading/error states — don't just render data". Without `loading.tsx`, Next.js App Router shows a blank page while the server component fetches data. This violates the established project convention and creates a visibly broken experience on any network with latency.

**Fix applied:** `loading.tsx` added to files_modified, with skeleton spec added to Task 2: pulse-animated skeleton rows matching the table layout, no spinner.

### F-03: No `error.tsx` — unhandled throw propagates to root — MUST-HAVE ✅ APPLIED

**Finding:** `getClients()` throws `new Error(error.message)` on DB failure with no route-level error boundary. Without `error.tsx`, the thrown error propagates up to the nearest parent boundary (or crashes the route entirely). This means a transient Supabase error shows a blank/broken page with no recovery path.

**Fix applied:** `error.tsx` added to files_modified, with spec added to Task 2: `'use client'`, friendly message "Something went wrong loading your clients.", "Try again" button calling `reset()`.

---

## Section 3 — Cache / Data Consistency

### F-04: `revalidatePath` missing `/dashboard` — STRONGLY RECOMMENDED ✅ APPLIED

**Finding:** The `addClient` action calls `revalidatePath('/dashboard/clients')` but not `revalidatePath('/dashboard')`. The dashboard page renders stat cards (e.g., client count). After adding a client, the count on the dashboard would be stale until the user navigates away and back.

**Fix applied:** Task 1 spec updated to call both `revalidatePath('/dashboard/clients')` and `revalidatePath('/dashboard')` on success.

---

## Section 4 — Accessibility / UX

### F-05: Modal missing keyboard accessibility — STRONGLY RECOMMENDED ✅ APPLIED

**Finding:** The modal spec had no Escape key handling and no focus trap. Modals without Escape-to-close and focus management are non-compliant with WCAG 2.1 AA and create a broken keyboard-only experience.

**Fix applied:** Task 2 spec updated with:
- Escape key close via `onKeyDown` or `useEffect` keydown listener
- Focus trap with first focusable element receiving focus on open
- `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to header

### F-06: Phone field lacks placeholder — STRONGLY RECOMMENDED ✅ APPLIED

**Finding:** Phone is a `tel` input with no placeholder. Users have no guidance on expected format (international, local, with/without dashes). This is especially relevant for a business context where the team enters client data.

**Fix applied:** Task 2 spec updated with `placeholder="+1 868 123 4567"` on the phone field.

---

## Section 5 — Deferred Findings

| # | Finding | Rationale for Deferral |
|---|---------|----------------------|
| D-01 | Optimistic UI for client creation | `revalidatePath` + Next.js cache refresh is sufficient for v0.1; optimistic UI adds complexity without clear user need at this scale |
| D-02 | Mobile-responsive table layout | Stack overflow / horizontal scroll on small screens; scoped to Phase 2 scope note "no responsive breakpoints required for v0.1" |
| D-03 | Pagination / virtual scroll | Client-side search is sufficient for v0.1 per explicit SCOPE LIMITS; revisit when client count exceeds ~200 |

---

## Section 6 — Compliance Notes

- PII handling: `addClient` spec explicitly avoids logging email addresses in error output — compliant with project constraint "No public exposure of client data"
- RLS: no schema changes in this plan; team-wide RLS (`USING true`) remains as established in Phase 1
- CSP: remains deferred per STATE.md deferred issues — no new vectors introduced by this plan

---

## Files Modified by Audit

- `.paul/phases/02-client-lead-management/02-01-PLAN.md` — all 6 findings applied

---

*Audit performed: 2026-03-28*
