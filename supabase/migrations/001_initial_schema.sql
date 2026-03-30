-- =============================================================
-- AYS CRM — Initial Schema
-- Migration: 001_initial_schema.sql
-- Run once in Supabase SQL Editor
-- =============================================================


-- -------------------------------------------------------------
-- TABLE: pipeline_stages (lookup table — seeded, never user-created)
-- -------------------------------------------------------------
CREATE TABLE pipeline_stages (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  sort_order INTEGER     NOT NULL,
  color      TEXT        NOT NULL DEFAULT '#6B7280',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- -------------------------------------------------------------
-- TABLE: clients
-- -------------------------------------------------------------
CREATE TABLE clients (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL CHECK (char_length(trim(name)) > 0),
  phone      TEXT,
  email      TEXT        CHECK (email IS NULL OR email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  source     TEXT        NOT NULL DEFAULT 'direct'
                         CHECK (source IN ('website','direct','referral','whatsapp','other')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- -------------------------------------------------------------
-- TABLE: projects (one client → many events/bookings)
-- -------------------------------------------------------------
CREATE TABLE projects (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id           UUID        NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title               TEXT        NOT NULL CHECK (char_length(trim(title)) > 0),
  event_date          DATE,
  pipeline_stage_id   UUID        REFERENCES pipeline_stages(id) ON DELETE SET NULL,
  next_action         TEXT,
  next_action_due_at  TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- -------------------------------------------------------------
-- TABLE: notes
-- General client notes (project_id IS NULL) or
-- project-specific notes (project_id IS NOT NULL)
-- -------------------------------------------------------------
CREATE TABLE notes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID        NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  project_id  UUID        REFERENCES projects(id) ON DELETE CASCADE,
  content     TEXT        NOT NULL CHECK (char_length(trim(content)) > 0),
  created_by  UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- =============================================================
-- SEED: pipeline_stages
-- =============================================================
INSERT INTO pipeline_stages (name, sort_order, color) VALUES
  ('New Lead',   1, '#3B82F6'),
  ('Contacted',  2, '#8B5CF6'),
  ('Quoted',     3, '#F59E0B'),
  ('Signed',     4, '#10B981'),
  ('Completed',  5, '#6B7280'),
  ('Cancelled',  6, '#EF4444');


-- =============================================================
-- TRIGGERS: auto-update updated_at on mutation
-- =============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- =============================================================
-- INDEXES
-- PostgreSQL does NOT auto-index FK columns — must be explicit
-- =============================================================

-- Prevent duplicate clients on same email (partial — email is nullable)
CREATE UNIQUE INDEX clients_email_unique
  ON clients(email)
  WHERE email IS NOT NULL;

-- FK performance indexes
CREATE INDEX idx_projects_client_id
  ON projects(client_id);

CREATE INDEX idx_projects_pipeline_stage_id
  ON projects(pipeline_stage_id);

-- Phase 3 (pipeline alerts) queries this frequently — must be indexed
CREATE INDEX idx_projects_next_action_due_at
  ON projects(next_action_due_at)
  WHERE next_action_due_at IS NOT NULL;

CREATE INDEX idx_notes_client_id
  ON notes(client_id);

CREATE INDEX idx_notes_project_id
  ON notes(project_id)
  WHERE project_id IS NOT NULL;


-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients         ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects        ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes           ENABLE ROW LEVEL SECURITY;

-- pipeline_stages: read-only for authenticated users (lookup table)
CREATE POLICY "Authenticated users can read pipeline_stages"
  ON pipeline_stages
  FOR SELECT
  TO authenticated
  USING (true);

-- clients: full access for authenticated users (team CRM — no per-user isolation in v0.1)
CREATE POLICY "Authenticated users can manage clients"
  ON clients
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- projects: full access for authenticated users
CREATE POLICY "Authenticated users can manage projects"
  ON projects
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- notes: full access for authenticated users
CREATE POLICY "Authenticated users can manage notes"
  ON notes
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
