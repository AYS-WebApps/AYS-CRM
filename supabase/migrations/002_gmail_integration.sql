-- =============================================================
-- AYS CRM — Gmail Integration Tables
-- Migration: 002_gmail_integration.sql
-- Run once in Supabase SQL Editor
-- =============================================================

-- Gmail OAuth2 credentials (one active row per connected account)
-- On reconnect: delete existing rows, insert fresh.
CREATE TABLE gmail_credentials (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT        NOT NULL,
  access_token  TEXT        NOT NULL,
  refresh_token TEXT        NOT NULL,
  token_expiry  TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE gmail_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_full_access" ON gmail_credentials
  FOR ALL USING (auth.role() = 'authenticated');

-- Track processed Gmail message IDs to prevent duplicate lead creation.
-- gmail_message_id is the unique ID from the Gmail API (e.g., "18e3c4f2a1b9d7c0").
CREATE TABLE gmail_processed_messages (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  gmail_message_id TEXT        NOT NULL UNIQUE,
  client_id        UUID        REFERENCES clients(id) ON DELETE SET NULL,
  processed_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE gmail_processed_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_full_access" ON gmail_processed_messages
  FOR ALL USING (auth.role() = 'authenticated');
