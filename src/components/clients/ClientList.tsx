'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Client, ClientSource } from '@/lib/types'
import CreateClientModal from './CreateClientModal'

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

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function ClientList({ clients }: { clients: Client[] }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = search.trim()
    ? clients.filter((c) => {
        const q = search.toLowerCase()
        return (
          c.name.toLowerCase().includes(q) ||
          (c.email?.toLowerCase().includes(q) ?? false) ||
          (c.phone?.toLowerCase().includes(q) ?? false)
        )
      })
    : clients

  return (
    <>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Add Client
        </button>
      </div>

      {clients.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <p className="text-gray-900 font-medium mb-1">No clients yet</p>
          <p className="text-gray-500 text-sm mb-4">
            Add your first client to get started.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Add your first client
          </button>
        </div>
      ) : (
        <>
          {/* Search */}
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="w-full max-w-sm mb-4 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />

          {filtered.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center">
              No clients match your search.
            </p>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Phone</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Source</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Date Added</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((client) => (
                    <tr
                      key={client.id}
                      className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/clients/${client.id}`}
                          className="font-medium text-gray-900 hover:text-sky-600 hover:underline"
                        >
                          {client.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{client.phone ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{client.email ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${SOURCE_CLASSES[client.source]}`}
                        >
                          {SOURCE_LABELS[client.source]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {formatDate(client.created_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/dashboard/clients/${client.id}?edit=1`}
                          className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <CreateClientModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}
