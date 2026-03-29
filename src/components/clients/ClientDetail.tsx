'use client'

import { useState, useTransition, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Client, ClientSource, ProjectWithStage, PipelineStageRow, NoteRow } from '@/lib/types'
import { updateClient, deleteClient } from '@/app/(dashboard)/dashboard/clients/[id]/actions'
import ProjectsSection from './ProjectsSection'
import NotesSection from './NotesSection'

const SOURCE_LABELS: Record<ClientSource, string> = {
  website: 'Website',
  direct: 'Direct',
  referral: 'Referral',
  whatsapp: 'WhatsApp',
  other: 'Other',
}

const SOURCE_CLASSES: Record<ClientSource, string> = {
  website: 'bg-blue-100 text-blue-700',
  direct: 'bg-gray-100 text-gray-600',
  referral: 'bg-green-100 text-green-700',
  whatsapp: 'bg-emerald-100 text-emerald-700',
  other: 'bg-gray-100 text-gray-600',
}

const SOURCE_OPTIONS: { value: ClientSource; label: string }[] = [
  { value: 'direct', label: 'Direct' },
  { value: 'website', label: 'Website' },
  { value: 'referral', label: 'Referral' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'other', label: 'Other' },
]

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

type Mode = 'view' | 'edit' | 'confirm-delete'

export default function ClientDetail({
  client,
  initialMode = 'view',
  projects,
  stages,
  notes,
}: {
  client: Client
  initialMode?: Mode
  projects: ProjectWithStage[]
  stages: PipelineStageRow[]
  notes: NoteRow[]
}) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>(initialMode)
  const [isPending, startTransition] = useTransition()
  const [nameError, setNameError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)

  // Escape key exits edit mode
  useEffect(() => {
    if (mode !== 'edit') return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMode('view')
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [mode])

  function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setNameError(null)
    setEmailError(null)
    setServerError(null)

    const formData = new FormData(e.currentTarget)
    const name = (formData.get('name') as string).trim()
    const email = (formData.get('email') as string).trim()

    if (!name) {
      setNameError('Name is required.')
      return
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email address.')
      return
    }

    startTransition(async () => {
      const result = await updateClient(client.id, formData)
      if ('error' in result) {
        setServerError(result.error)
      } else {
        router.refresh()
        setMode('view')
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteClient(client.id)
    })
  }

  return (
    <div>
      {/* Back link */}
      <Link
        href="/dashboard/clients"
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        ← Clients
      </Link>

      {/* Header row */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
          <span
            className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${SOURCE_CLASSES[client.source]}`}
          >
            {SOURCE_LABELS[client.source]}
          </span>
        </div>
        {mode === 'view' && (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setNameError(null)
                setEmailError(null)
                setServerError(null)
                setMode('edit')
              }}
              className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => setMode('confirm-delete')}
              className="px-4 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Confirm delete banner */}
      {mode === 'confirm-delete' && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm font-medium text-red-800 mb-3">
            Are you sure? Deleting <strong>{client.name}</strong> cannot be undone.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? 'Deleting...' : 'Confirm Delete'}
            </button>
            <button
              onClick={() => setMode('view')}
              disabled={isPending}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Detail card — VIEW mode */}
      {mode === 'view' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <dl className="space-y-4">
            <div className="flex gap-4">
              <dt className="w-28 text-sm font-medium text-gray-500 shrink-0">Phone</dt>
              <dd className="text-sm text-gray-900">{client.phone ?? '—'}</dd>
            </div>
            <div className="flex gap-4">
              <dt className="w-28 text-sm font-medium text-gray-500 shrink-0">Email</dt>
              <dd className="text-sm text-gray-900">{client.email ?? '—'}</dd>
            </div>
            <div className="flex gap-4">
              <dt className="w-28 text-sm font-medium text-gray-500 shrink-0">Source</dt>
              <dd className="text-sm text-gray-900">{SOURCE_LABELS[client.source]}</dd>
            </div>
            <div className="flex gap-4">
              <dt className="w-28 text-sm font-medium text-gray-500 shrink-0">Date Added</dt>
              <dd className="text-sm text-gray-900">{formatDate(client.created_at)}</dd>
            </div>
          </dl>
        </div>
      )}

      {/* Edit form — EDIT mode */}
      {mode === 'edit' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <form onSubmit={handleEditSubmit} noValidate>
            {/* Name */}
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                defaultValue={client.name}
                autoComplete="name"
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent ${
                  nameError ? 'border-red-400' : 'border-gray-300'
                }`}
              />
              {nameError && <p className="mt-1 text-xs text-red-600">{nameError}</p>}
            </div>

            {/* Phone */}
            <div className="mb-4">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={client.phone ?? ''}
                autoComplete="tel"
                placeholder="+1 868 123 4567"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>

            {/* Email */}
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                defaultValue={client.email ?? ''}
                autoComplete="email"
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent ${
                  emailError ? 'border-red-400' : 'border-gray-300'
                }`}
              />
              {emailError && <p className="mt-1 text-xs text-red-600">{emailError}</p>}
            </div>

            {/* Source */}
            <div className="mb-5">
              <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-1">
                Source
              </label>
              <select
                id="source"
                name="source"
                defaultValue={client.source}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white"
              >
                {SOURCE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
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
                onClick={() => setMode('view')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
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
      )}

      {/* General Notes — client-level notes, shown right after client info */}
      <div className="mt-8">
        <NotesSection
          clientId={client.id}
          notes={notes.filter((n) => !n.project_id)}
        />
      </div>

      {/* Projects section */}
      <div className="mt-8">
        <ProjectsSection
          clientId={client.id}
          projects={projects}
          stages={stages}
          notes={notes}
        />
      </div>
    </div>
  )
}
