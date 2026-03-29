'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { ProjectWithStage, PipelineStageRow, NoteRow } from '@/lib/types'
import { updateProject, deleteProject } from '@/app/(dashboard)/dashboard/clients/[id]/project-actions'
import CreateProjectModal from './CreateProjectModal'
import NotesSection from './NotesSection'

interface Props {
  clientId: string
  projects: ProjectWithStage[]
  stages: PipelineStageRow[]
  notes: NoteRow[]
}

// For DATE columns (YYYY-MM-DD): append T00:00:00 to parse as local time,
// not UTC midnight (which shifts the day back in negative-offset timezones)
function formatDate(dateString: string | null): string {
  if (!dateString) return '—'
  const d = dateString.includes('T') ? new Date(dateString) : new Date(dateString + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Convert TIMESTAMPTZ to YYYY-MM-DD for date input value
function formatDateForInput(dateString: string | null): string {
  if (!dateString) return ''
  return new Date(dateString).toISOString().split('T')[0]
}

export default function ProjectsSection({ clientId, projects, stages, notes }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [titleError, setTitleError] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)

  function startEdit(projectId: string) {
    setEditingId(projectId)
    setDeletingId(null) // mutual exclusion
    setTitleError(null)
    setServerError(null)
  }

  function startDelete(projectId: string) {
    setDeletingId(projectId)
    setEditingId(null) // mutual exclusion
    setServerError(null)
  }

  function handleEditSubmit(e: React.FormEvent<HTMLFormElement>, projectId: string) {
    e.preventDefault()
    setTitleError(null)
    setServerError(null)

    const formData = new FormData(e.currentTarget)
    const title = (formData.get('title') as string).trim()

    if (!title) {
      setTitleError('Title is required.')
      return
    }

    startTransition(async () => {
      const result = await updateProject(projectId, clientId, formData)
      if ('error' in result) {
        setServerError(result.error)
      } else {
        router.refresh()
        setEditingId(null)
      }
    })
  }

  function handleDelete(projectId: string) {
    startTransition(async () => {
      const result = await deleteProject(projectId, clientId)
      if ('error' in result) {
        setServerError(result.error)
      } else {
        router.refresh()
        setDeletingId(null)
      }
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Projects</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-3 py-1.5 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          + Add Project
        </button>
      </div>

      {/* Server error banner */}
      {serverError && (
        <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
          {serverError}
        </div>
      )}

      {/* Empty state */}
      {projects.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-sm text-gray-500 mb-3">No projects yet</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Add Project
          </button>
        </div>
      )}

      {/* Project cards */}
      <div className="space-y-3">
        {projects.map((project) => {
          const stageColor = project.pipeline_stages?.color ?? '#6B7280'
          const stageName = project.pipeline_stages?.name ?? 'Unknown'

          // CONFIRM-DELETE mode
          if (deletingId === project.id) {
            return (
              <div key={project.id} className="bg-white rounded-xl border border-red-200 p-4">
                <p className="text-sm font-medium text-red-800 mb-3">
                  Delete <strong>{project.title}</strong>? This cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDelete(project.id)}
                    disabled={isPending}
                    className="px-3 py-1.5 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPending ? 'Deleting...' : 'Confirm Delete'}
                  </button>
                  <button
                    onClick={() => setDeletingId(null)}
                    disabled={isPending}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )
          }

          // EDIT mode
          if (editingId === project.id) {
            return (
              <div key={project.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <form onSubmit={(e) => handleEditSubmit(e, project.id)} noValidate>
                  {/* Title */}
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="title"
                      type="text"
                      defaultValue={project.title}
                      className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent ${
                        titleError ? 'border-red-400' : 'border-gray-300'
                      }`}
                    />
                    {titleError && <p className="mt-1 text-xs text-red-600">{titleError}</p>}
                  </div>

                  {/* Event Date */}
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Event Date
                    </label>
                    <input
                      name="event_date"
                      type="date"
                      defaultValue={project.event_date ?? ''}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                  </div>

                  {/* Pipeline Stage */}
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Pipeline Stage
                    </label>
                    <select
                      name="pipeline_stage_id"
                      defaultValue={project.pipeline_stage_id ?? ''}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white"
                    >
                      <option value="">— None —</option>
                      {stages.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Next Action */}
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Next Action
                    </label>
                    <input
                      name="next_action"
                      type="text"
                      defaultValue={project.next_action ?? ''}
                      placeholder="e.g. Send quote"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                  </div>

                  {/* Next Action Due */}
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Due Date
                    </label>
                    <input
                      name="next_action_due_at"
                      type="date"
                      defaultValue={formatDateForInput(project.next_action_due_at)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      disabled={isPending}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="px-3 py-1.5 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isPending ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </form>
              </div>
            )
          }

          // VIEW mode
          return (
            <div key={project.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 truncate">{project.title}</p>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        style={{
                          color: stageColor,
                          backgroundColor: stageColor + '33',
                        }}
                        className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium"
                      >
                        {stageName}
                      </span>
                      {project.event_date && (
                        <span className="text-xs text-gray-500">
                          {formatDate(project.event_date)}
                        </span>
                      )}
                    </div>
                    {project.next_action ? (
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">Next:</span> {project.next_action}
                        {project.next_action_due_at && (
                          <span className="text-gray-400 ml-1">
                            · due {formatDate(project.next_action_due_at)}
                          </span>
                        )}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400">No next action set</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => startEdit(project.id)}
                    className="px-2.5 py-1 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => startDelete(project.id)}
                    className="px-2.5 py-1 text-xs font-medium text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Project Notes */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <NotesSection
                  clientId={clientId}
                  projectId={project.id}
                  notes={notes.filter((n) => n.project_id === project.id)}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Create modal */}
      {showCreateModal && (
        <CreateProjectModal
          clientId={clientId}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => router.refresh()}
        />
      )}
    </div>
  )
}
