-- =============================================================
-- Migration 003: Note author tracking + cron support
-- Run once in Supabase SQL Editor
-- =============================================================

-- Track who created and last edited each note
ALTER TABLE notes ADD COLUMN IF NOT EXISTS created_by_email TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS updated_by_email TEXT;
