# Enterprise Plan Audit Report

**Plan:** .paul/phases/01-foundation/01-02-PLAN.md
**Audited:** 2026-03-28
**Verdict:** Conditionally Acceptable → Upgraded to Enterprise-Ready after remediation

---

## 1. Executive Verdict

**Conditionally acceptable before remediation. Enterprise-ready after.**

The plan establishes a correct relational model with good FK cascade behavior and a solid two-tier notes design. However, four must-have gaps would have caused immediate production failures:

1. No FK indexes → full table scans on every "get projects for client" query
2. No duplicate client guard → the CRM's data integrity broken from day one
3. Empty string bypass on NOT NULL fields → phantom clients and blank notes in the database
4. No `next_action_due_at` index → Phase 3 (pipeline alerts) would be broken at launch

All four were applied. The plan is now enterprise-ready for execution.

---

## 2. What Is Solid

**Two-tier notes design via nullable `project_id`:** Correct. One table handles both general client notes and project-specific notes cleanly. No over-engineering.

**CASCADE semantics:** `clients → projects → notes` cascade is correct for a CRM where a deleted client should have no orphaned data. `pipeline_stages → projects ON DELETE SET NULL` is also correct (deleting a stage shouldn't destroy project history).

**RLS approach:** Team-wide access (`USING (true)`) is appropriate for a v0.1 internal tool. The plan correctly avoids per-user RLS complexity while still enabling RLS (so it can be tightened later).

**TIMESTAMPTZ for all timestamps:** Correct. Stores UTC, displays in user timezone. Avoids the timezone conversion bugs that plague CRMs.

**`updated_at` triggers:** Correct mechanism. Prevents the common bug where application code forgets to update `updated_at` on partial updates.

**`source` CHECK constraint:** `CHECK (source IN ('website','direct','referral','whatsapp','other'))` correctly locks source values at the DB level, not just the application layer.

**TypeScript types following Supabase pattern:** Row/Insert/Update split is the right approach. Avoids the common mistake of using one type for both reads and writes.

---

## 3. Enterprise Gaps Identified

### Gap 1 (Must-Have): Missing indexes on all FK columns
PostgreSQL does NOT automatically create indexes on foreign key columns. `projects.client_id`, `projects.pipeline_stage_id`, `notes.client_id`, `notes.project_id` had no indexes. Every query for "get all projects for a client" would do a full sequential scan of the `projects` table. At 1,000 clients with 5 projects each, this is 5,000 row scans per page load. Unacceptable.

Also missing: `projects.next_action_due_at` index. Phase 3's core feature ("show all overdue actions") queries this column with a WHERE clause — without an index, this is O(n) across the entire projects table.

### Gap 2 (Must-Have): No unique constraint preventing duplicate clients
No guard on `clients.email`. Two staff members can independently create "Jane Smith" and "Jane Smith" as separate records with the same email. This is the most common CRM data quality failure. A partial unique index (`WHERE email IS NOT NULL`) handles the nullable case correctly.

### Gap 3 (Must-Have): Empty string bypass on NOT NULL columns
`clients.name TEXT NOT NULL` and `notes.content TEXT NOT NULL` prevent NULL but not `''` or `'   '`. A client named `''` or `'   '` would be created successfully and appear as a blank row in the UI. Notes with empty content would show as phantom entries. Both need `CHECK (char_length(trim(column)) > 0)`.

### Gap 4 (Must-Have): No `next_action_due_at` index
The `next_action_due_at` column is the core of Phase 3 (pipeline notifications). The query pattern will be: `SELECT * FROM projects WHERE next_action_due_at < now() ORDER BY next_action_due_at`. Without an index on this column, this query scans the entire `projects` table on every dashboard load. Should be created now while the migration is being written.

### Gap 5 (Strongly Recommended): No email format validation
`clients.email TEXT` accepted any string. A basic regex check (`email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'`) prevents obvious garbage (`notanemail`, `@`, `test@`) from being stored. Important because Phase 5 (Gmail auto-capture) will write parsed email addresses to this field — a constraint catches bad parsing immediately.

### Gap 6 (Strongly Recommended): `pipeline_stage_id` default is undocumented
The column is nullable but new projects should always start in "New Lead". Since the UUID isn't known at DDL time, this must be enforced at the application layer. The plan didn't document this invariant. Without explicit documentation, Phase 2 developers will create projects with NULL `pipeline_stage_id`, making them invisible in the Phase 3 pipeline board.

---

## 4. Upgrades Applied to Plan

### Must-Have (Release-Blocking)

| # | Finding | Plan Section Modified | Change Applied |
|---|---------|----------------------|----------------|
| 1 | Missing FK indexes | Task 1 → action | Added 5 CREATE INDEX statements: idx_projects_client_id, idx_projects_pipeline_stage_id, idx_projects_next_action_due_at, idx_notes_client_id, idx_notes_project_id |
| 2 | No duplicate client guard | Task 1 → action | Added partial unique index: `CREATE UNIQUE INDEX clients_email_unique ON clients(email) WHERE email IS NOT NULL` |
| 3 | Empty string bypass on clients.name | Task 1 → action | Added `CHECK (char_length(trim(name)) > 0)` to clients.name |
| 4 | Empty string bypass on notes.content | Task 1 → action | Added `CHECK (char_length(trim(content)) > 0)` to notes.content |

### Strongly Recommended

| # | Finding | Plan Section Modified | Change Applied |
|---|---------|----------------------|----------------|
| 1 | No email format validation | Task 1 → action | Added `CHECK (email IS NULL OR email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')` to clients.email |
| 2 | pipeline_stage_id default undocumented | Task 1 → action | Added explicit application-layer rule: "When inserting a project, resolve 'New Lead' stage ID and set it" |

### Deferred (Can Safely Defer)

| # | Finding | Rationale for Deferral |
|---|---------|----------------------|
| 1 | Idempotency (IF NOT EXISTS guards) | Migration runs once, low double-execution risk |
| 2 | `updated_by` on notes | Full audit trail is a v2 concern, not required for team CRM v0.1 |
| 3 | Full audit log table | Beyond scope for v0.1 |
| 4 | Phone format validation | International phone formats vary widely; complex to validate correctly; low-risk since phone is display-only in v0.1 |

---

## 5. Audit & Compliance Readiness

**Evidence generation:** The migration file in `supabase/migrations/` serves as a deployable record of schema intent. The verification step now includes an index check query that produces machine-readable proof.

**Silent failure prevention:** The CHECK constraints and unique index will surface data quality issues at insert time (immediate error) rather than at query time (silent wrong data). This is the correct behavior for a CRM.

**Post-incident reconstruction:** `created_at` on all tables enables time-based reconstruction. `updated_at` triggers track mutation history. `notes.created_by` links notes to team members. Limitation: no audit log of who deleted what — acceptable for v0.1.

**Ownership:** Supabase handles the authoritative schema state. The migration file in the repo is the declarative record. Gap: no schema drift detection (Supabase drift detection requires CLI) — acceptable for v0.1, address before multi-environment deployment.

---

## 6. Final Release Bar

**Must be true before shipping:**
- All 5 indexes created and verified via `pg_indexes` query
- `clients_email_unique` partial index exists
- Empty string constraints tested against Supabase SQL editor
- TypeScript compiles with no errors
- All 7 acceptance criteria pass user verification

**Remaining risks if shipped as-is (post-remediation):**
- Hard CASCADE deletes are unrecoverable — team must know that deleting a client deletes all their history permanently. No undo. Low risk for v0.1 (internal tool, controlled access).
- No schema migration versioning tool (no Supabase CLI, no Prisma) — future schema changes require manual SQL in Supabase editor. Acceptable for v0.1; becomes a risk at Phase 5+ when schema complexity increases.

**Sign-off:** With the 6 applied upgrades, this schema is production-defensible for a v0.1 internal team CRM. I would approve execution.

---

**Summary:** Applied 4 must-have + 2 strongly-recommended upgrades. Deferred 4 items.
**Plan status:** Updated and ready for APPLY.

---
*Audit performed by PAUL Enterprise Audit Workflow*
*Audit template version: 1.0*
