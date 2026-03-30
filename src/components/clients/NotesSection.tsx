'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { NoteRow } from '@/lib/types'
import { addNote, updateNote, deleteNote } from '@/app/(dashboard)/dashboard/clients/[id]/note-actions'

const AUTHOR_NAMES: Record<string, string> = {
  'skia@ayspr.com': 'Skia',
  'info@ayspr.com': 'Alexis',
  'steven@ayspr.com': 'Steven',
}

function getAuthorName(email: string | null): string | null {
  if (!email) return null
  return AUTHOR_NAMES[email.toLowerCase()] ?? email.split('@')[0]
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function NotesSection({
  clientId,
  projectId,
  notes,
}: {
  clientId: string
  projectId?: string | null
  notes: NoteRow[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [content, setContent] = useState('')
  const [addError, setAddError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editError, setEditError] = useState<string | null>(null)

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setAddError(null)
    if (!content.trim()) {
      setAddError('Note cannot be empty.')
      return
    }
    startTransition(async () => {
      const result = await addNote(clientId, content, projectId ?? null)
      if ('error' in result) {
        setAddError(result.error)
      } else {
        setContent('')
        router.refresh()
      }
    })
  }

  function startEdit(note: NoteRow) {
    setEditingId(note.id)
    setEditContent(note.content)
    setEditError(null)
    setDeletingId(null)
  }

  function handleEditSave(noteId: string) {
    setEditError(null)
    startTransition(async () => {
      const result = await updateNote(noteId, clientId, editContent)
      if ('error' in result) {
        setEditError(result.error)
      } else {
        setEditingId(null)
        router.refresh()
      }
    })
  }

  function handleDelete(noteId: string) {
    startTransition(async () => {
      const result = await deleteNote(noteId, clientId)
      if ('error' in result) {
        setDeleteError(result.error)
      } else {
        setDeletingId(null)
        router.refresh()
      }
    })
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Notes</h3>

      {/* Add form */}
      <form onSubmit={handleAdd} className="mb-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={2}
          placeholder="Add a note..."
          maxLength={2000}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
        />
        {addError && <p className="mt-1 text-xs text-red-600">{addError}</p>}
        <div className="flex justify-end mt-2">
          <button
            type="submit"
            disabled={isPending || !content.trim()}
            className="px-3 py-1.5 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Adding...' : 'Add Note'}
          </button>
        </div>
      </form>

      {/* Note list */}
      {deleteError && <p className="mb-2 text-xs text-red-600">{deleteError}</p>}

      {notes.length === 0 && (
        <p className="text-sm text-gray-400">No notes yet.</p>
      )}

      <div className="space-y-2">
        {notes.map((note) => {
          const createdBy = getAuthorName(note.created_by_email)
          const editedBy = getAuthorName(note.updated_by_email)
          const wasEdited = !!note.updated_by_email

          // CONFIRM-DELETE mode
          if (deletingId === note.id) {
            return (
              <div key={note.id} className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <p className="text-xs text-amber-800 mb-2">Delete this note?</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDelete(note.id)}
                    disabled={isPending}
                    className="px-2.5 py-1 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {isPending ? '...' : 'Yes, delete'}
                  </button>
                  <button
                    onClick={() => setDeletingId(null)}
                    disabled={isPending}
                    className="px-2.5 py-1 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )
          }

          // EDIT mode
          if (editingId === note.id) {
            return (
              <div key={note.id} className="bg-gray-50 rounded-lg px-3 py-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                />
                {editError && <p className="mt-1 text-xs text-red-600">{editError}</p>}
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleEditSave(note.id)}
                    disabled={isPending || !editContent.trim()}
                    className="px-2.5 py-1 text-xs font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPending ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    disabled={isPending}
                    className="px-2.5 py-1 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )
          }

          // VIEW mode
          return (
            <div key={note.id} className="bg-gray-50 rounded-lg px-3 py-2">
              <p className="text-sm text-gray-900 whitespace-pre-wrap break-words">
                {note.content}
              </p>
              <div className="mt-1.5 space-y-0.5">
                <p className="text-xs text-gray-400">
                  Created by{' '}
                  <span className="text-gray-500 font-medium">
                    {createdBy ?? 'Unknown'}
                  </span>
                  {' · '}
                  {formatDateTime(note.created_at)}
                </p>
                {wasEdited && (
                  <p className="text-xs text-gray-400">
                    Edited by{' '}
                    <span className="text-gray-500 font-medium">
                      {editedBy ?? 'Unknown'}
                    </span>
                    {' · '}
                    {formatDateTime(note.updated_at)}
                  </p>
                )}
              </div>
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => startEdit(note)}
                  className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    setDeletingId(note.id)
                    setDeleteError(null)
                  }}
                  className="text-xs text-red-400 hover:text-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
