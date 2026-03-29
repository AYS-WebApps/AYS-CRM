import Link from 'next/link'

export default function ClientNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-gray-900 font-medium mb-1">Client not found.</p>
      <p className="text-gray-500 text-sm mb-4">
        This client may have been deleted or the link is incorrect.
      </p>
      <Link
        href="/dashboard/clients"
        className="text-sm text-sky-600 hover:underline"
      >
        ← Back to clients
      </Link>
    </div>
  )
}
