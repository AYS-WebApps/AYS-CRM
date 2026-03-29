import type {
  Database,
  ClientSource,
  PipelineStageRow,
  PipelineStageInsert,
  PipelineStageUpdate,
  ClientRow,
  ClientInsert,
  ClientUpdate,
  ProjectRow,
  ProjectInsert,
  ProjectUpdate,
  ProjectWithStage,
  AlertProject,
  NoteRow,
  NoteInsert,
  NoteUpdate,
} from './database'

// Re-export everything
export type { Database }
export type {
  ClientSource,
  PipelineStageRow,
  PipelineStageInsert,
  PipelineStageUpdate,
  ClientRow,
  ClientInsert,
  ClientUpdate,
  ProjectRow,
  ProjectInsert,
  ProjectUpdate,
  ProjectWithStage,
  AlertProject,
  NoteRow,
  NoteInsert,
  NoteUpdate,
}

// Convenience aliases — use these in components
export type PipelineStage = PipelineStageRow
export type Client = ClientRow
export type Project = ProjectRow
export type Note = NoteRow

export type Tables = Database['public']['Tables']
