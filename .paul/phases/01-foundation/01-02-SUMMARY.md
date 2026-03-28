---
phase: 01-foundation
plan: 02
subsystem: database
tags: [postgresql, supabase, rls, migrations, typescript, schema]

requires:
  - phase: 01-01
    provides: Supabase project connected, server client helper available

provides:
  - 4 core tables: pipeline_stages, clients, projects, notes
  - 6 seeded pipeline stages (New Lead → Cancelled)
  - RLS policies (team-wide authenticated access)
  - 6 performance indexes including partial unique index on clients.email
  - TypeScript types for all tables (Row/Insert/Update shape)
affects: [02-client-lead-management, 03-pipeline, 04-notes, 05-gmail, 06-whatsapp]

tech-stack:
  added: []
  patterns: [supabase-migrations-via-sql-editor, row-insert-update-type-split, partial-unique-index]

key-files:
  created:
    - supabase/migrations/001_initial_schema.sql
    - src/lib/types/database.ts
    - src/lib/types/index.ts

key-decisions:
  - "Two-tier notes via nullable project_id — one table, not two"
  - "Partial unique index on clients.email WHERE email IS NOT NULL — handles nullable email"
  - "pipeline_stage_id default is application-layer responsibility — UUID not known at DDL time"
  - "Hard CASCADE deletes accepted for v0.1 — no soft deletes"
  - "Team-wide RLS (USING true) — no per-user isolation for v0.1"

patterns-established:
  - "New projects MUST resolve 'New Lead' stage_id at insert time — never insert with NULL pipeline_stage_id"
  - "ClientSource union type enforced at both DB (CHECK) and TS (union) layers"
  - "Use Row/Insert/Update type split — never use Row type for inserts"

duration: ~30min
started: 2026-03-28T00:00:00.000Z
completed: 2026-03-28T00:00:00.000Z
---

# Phase 1 Plan 02: Database Schema Summary

**PostgreSQL schema with 4 tables, RLS, 6 indexes, seeded pipeline stages, and TypeScript types — all verified in Supabase and passing strict TypeScript compilation.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~30 min |
| Started | 2026-03-28 |
| Completed | 2026-03-28 |
| Tasks | 1 auto + 2 checkpoints completed |
| Files created | 3 |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: All tables exist | Pass | 4 tables confirmed in Table Editor |
| AC-2: Pipeline stages seeded | Pass | 6 rows: New Lead → Cancelled |
| AC-3: RLS protects tables | Pass | All 4 policies verified in Auth → Policies |
| AC-4: Two-tier notes by design | Pass | project_id nullable — NULL = general, NOT NULL = project-specific |
| AC-5: TypeScript types match schema | Pass | `npx tsc --noEmit` clean |
| AC-6: FK cascades protect integrity | Pass | ON DELETE CASCADE on all dependent tables |
| AC-7: Data integrity constraints enforced | Pass | CHECK constraints on name, content, email format; unique index on email |

## Accomplishments

- Complete data model for all 6 phases established in one migration
- Audit-added constraints prevent the most common CRM data failures (duplicates, empty records, invalid emails)
- All 6 FK performance indexes in place before any data is written — zero technical debt on query performance
- TypeScript types follow Supabase generated-types shape — future `supabase gen types` will be a drop-in replacement

## Files Created

| File | Purpose |
|------|---------|
| `supabase/migrations/001_initial_schema.sql` | Full schema: 4 tables, triggers, 6 indexes, RLS, seed data (171 lines) |
| `src/lib/types/database.ts` | Row/Insert/Update types for all 4 tables + ClientSource union |
| `src/lib/types/index.ts` | Convenience aliases: Client, Project, Note, PipelineStage |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| Two-tier notes via nullable project_id | One table instead of two — simpler queries, one RLS policy | Phase 4 (notes UI) just filters by `project_id IS NULL` or `IS NOT NULL` |
| Hard CASCADE deletes | Soft deletes add complexity; v0.1 team will not accidentally delete clients | Must be addressed before public-facing or multi-user version |
| Team-wide RLS | Single-team CRM; no per-user data isolation needed in v0.1 | Can tighten to `auth.uid() = created_by` in future without schema change |
| Application-layer pipeline_stage default | Cannot reference seeded UUID in DDL | Phase 2 MUST always resolve 'New Lead' ID at insert time |

## Deviations from Plan

### Summary

| Type | Count | Impact |
|------|-------|--------|
| Auto-fixed | 0 | — |
| Scope additions (audit) | 6 | All applied pre-execution via audit |
| Deferred | 4 | Logged in AUDIT.md |

All audit additions were pre-applied to PLAN.md before execution — no deviations during execution itself.

## Issues Encountered

| Issue | Resolution |
|-------|------------|
| `src/lib/types/index.ts` — type aliases not in scope | Fixed import structure — explicit `import type {}` before re-exporting and aliasing |
| `.next/types/validator.ts` referenced stale dashboard paths | Ran `npm run build` to regenerate .next/ with correct `(dashboard)/dashboard/` paths |

## Next Phase Readiness

**Ready:**
- All tables for Phase 2 (clients, projects) exist with correct columns and constraints
- All tables for Phase 4 (notes) exist with two-tier design
- `ClientSource` type enforced at DB + TypeScript level — Phase 2 can import directly
- `src/lib/types/index.ts` ready to import: `import type { Client, Project, Note, PipelineStage } from '@/lib/types'`
- Performance indexes in place — Phase 2 can query without concern

**Concerns:**
- Application must always set `pipeline_stage_id` to 'New Lead' on new projects — Phase 2 developers must know this invariant
- Hard CASCADE deletes are permanent — team should be informed before using delete functionality in Phase 2 UI

**Blockers:**
- None
