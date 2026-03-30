-- =============================================================
-- Migration 002: Rename 'Confirmed' stage + add project_link
-- Run once in Supabase SQL Editor
-- =============================================================

-- Rename 'Confirmed' pipeline stage to 'Signed'
UPDATE pipeline_stages SET name = 'Signed' WHERE name = 'Confirmed';

-- Add optional project_link column to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_link TEXT;
