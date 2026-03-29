'use client'

import { useRef, useEffect, useTransition, useState } from 'react'
import { createProject } from '@/app/(dashboard)/dashboard/clients/[id]/project-actions'

interface Props {
  clientId: string
  onClose: () => void
  onCreated: () => void
}

export default function CreateProjectModal({ clientId, onClose, onCreated }: Props) {
  const titleRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()
  const [titleError, setTitleError] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)

  // Auto-focus title on open
  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  // Escape key closes modal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
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
      const result = await createProject(clientId, formData)
      if ('error' in result) {
        setServerError(result.error)
      } else {
        onCreated()
        onClose()
      }
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <h2 id="modal-title" className="text-lg font-semibold text-gray-900 mb-5">
          Add Project
        </h2>

        <form onSubmit={handleSubmit} noValidate>
          {/* Title */}
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              ref={titleRef}
              id="title"
              name="title"
              type="text"
              placeholder="e.g. Wedding 2026"
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent ${
                titleError ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {titleError && <p className="mt-1 text-xs text-red-600">{titleError}</p>}
          </div>

          {/* Event Date */}
          <div className="mb-5">
            <label htmlFor="event_date" className="block text-sm font-medium text-gray-700 mb-1">
              Event Date
            </label>
            <input
              id="event_date"
              name="event_date"
              type="date"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>

          {/* Server error */}
          {serverError && (
            <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {serverError}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
