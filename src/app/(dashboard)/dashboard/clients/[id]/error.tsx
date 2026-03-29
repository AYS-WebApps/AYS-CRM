'use client'

export default function ClientDetailError({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  if (process.env.NODE_ENV === 'development') {
    console.error('[ClientDetailError]', error)
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-gray-900 font-medium mb-1">
        Something went wrong loading this client.
      </p>
      <p className="text-gray-500 text-sm mb-4">
        The error has been logged. You can try again.
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors"
      >
        Try again
      </button>
    </div>
  )
}
