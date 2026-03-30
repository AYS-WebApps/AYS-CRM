/**
 * AYS CRM — Database Type Definitions
 * Follows Supabase generated-types shape (Row / Insert / Update per table).
 *
 * Application-layer invariant:
 *   When inserting a project, always resolve the 'New Lead' pipeline_stage_id
 *   and set it explicitly. Projects with NULL pipeline_stage_id are invisible
 *   in the pipeline board (Phase 3).
 */

export type ClientSource = 'website' | 'direct' | 'referral' | 'whatsapp' | 'other'

// ------------------------------------------------------------------
// pipeline_stages
// ------------------------------------------------------------------
export interface PipelineStageRow {
  id: string
  name: string
  sort_order: number
  color: string
  created_at: string
}

export interface PipelineStageInsert {
  id?: string
  name: string
  sort_order: number
  color?: string
  created_at?: string
}

export type PipelineStageUpdate = Partial<PipelineStageInsert>

// ------------------------------------------------------------------
// clients
// ------------------------------------------------------------------
export interface ClientRow {
  id: string
  name: string
  phone: string | null
  email: string | null
  source: ClientSource
  created_at: string
  updated_at: string
}

export interface ClientInsert {
  id?: string
  name: string
  phone?: string | null
  email?: string | null
  source?: ClientSource
  created_at?: string
  updated_at?: string
}

export type ClientUpdate = Partial<ClientInsert>

// ------------------------------------------------------------------
// projects
// ------------------------------------------------------------------
export interface ProjectRow {
  id: string
  client_id: string
  title: string
  event_date: string | null
  pipeline_stage_id: string | null
  next_action: string | null
  next_action_due_at: string | null
  project_link: string | null
  created_at: string
  updated_at: string
}

export interface ProjectInsert {
  id?: string
  client_id: string
  title: string
  event_date?: string | null
  pipeline_stage_id?: string | null
  next_action?: string | null
  next_action_due_at?: string | null
  project_link?: string | null
  created_at?: string
  updated_at?: string
}

export type ProjectUpdate = Partial<ProjectInsert>

// Project joined with its pipeline stage (used in list/detail queries)
// Matches Supabase select('*, pipeline_stages(name, color)') shape
export interface ProjectWithStage extends ProjectRow {
  pipeline_stages: Pick<PipelineStageRow, 'name' | 'color'> | null
}

// Project joined with pipeline stage + client — for the alerts/next-action view
// next_action and next_action_due_at are non-nullable here (filtered at query time)
// clients is non-nullable due to FK constraint (every project has a client)
export interface AlertProject {
  id: string
  client_id: string
  title: string
  next_action: string
  next_action_due_at: string
  pipeline_stage_id: string | null
  pipeline_stages: Pick<PipelineStageRow, 'name' | 'color'> | null
  clients: Pick<ClientRow, 'id' | 'name'>
}

// ------------------------------------------------------------------
// notes
// project_id IS NULL  → general client note
// project_id NOT NULL → project-specific note
// ------------------------------------------------------------------
export interface NoteRow {
  id: string
  client_id: string
  project_id: string | null
  content: string
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface NoteInsert {
  id?: string
  client_id: string
  project_id?: string | null
  content: string
  created_by?: string | null
  created_at?: string
  updated_at?: string
}

export type NoteUpdate = Partial<NoteInsert>

// ------------------------------------------------------------------
// gmail_credentials
// One active row — stores the connected Gmail account's OAuth tokens.
// On reconnect: delete all rows, insert fresh.
// NOTE: Tokens stored as plaintext; Supabase encrypts at rest (AES-256).
//       Accepted risk for v0.1 internal tool.
// ------------------------------------------------------------------
export interface GmailCredentialRow {
  id: string
  email: string
  access_token: string
  refresh_token: string
  token_expiry: string
  created_at: string
  updated_at: string
}

export interface GmailCredentialInsert {
  id?: string
  email: string
  access_token: string
  refresh_token: string
  token_expiry: string
  created_at?: string
  updated_at?: string
}

export type GmailCredentialUpdate = Partial<GmailCredentialInsert>

// ------------------------------------------------------------------
// gmail_processed_messages
// Deduplication table — records Gmail message IDs that have been
// turned into leads to prevent re-processing on subsequent polls.
// ------------------------------------------------------------------
export interface GmailProcessedMessageRow {
  id: string
  gmail_message_id: string
  client_id: string | null
  processed_at: string
}

export interface GmailProcessedMessageInsert {
  id?: string
  gmail_message_id: string
  client_id?: string | null
  processed_at?: string
}

export type GmailProcessedMessageUpdate = Partial<GmailProcessedMessageInsert>

// ------------------------------------------------------------------
// Supabase Database shape (compatible with createClient<Database>())
// ------------------------------------------------------------------
export type Database = {
  public: {
    Tables: {
      pipeline_stages: {
        Row: PipelineStageRow
        Insert: PipelineStageInsert
        Update: PipelineStageUpdate
      }
      clients: {
        Row: ClientRow
        Insert: ClientInsert
        Update: ClientUpdate
      }
      projects: {
        Row: ProjectRow
        Insert: ProjectInsert
        Update: ProjectUpdate
      }
      notes: {
        Row: NoteRow
        Insert: NoteInsert
        Update: NoteUpdate
      }
      gmail_credentials: {
        Row: GmailCredentialRow
        Insert: GmailCredentialInsert
        Update: GmailCredentialUpdate
      }
      gmail_processed_messages: {
        Row: GmailProcessedMessageRow
        Insert: GmailProcessedMessageInsert
        Update: GmailProcessedMessageUpdate
      }
    }
  }
}
