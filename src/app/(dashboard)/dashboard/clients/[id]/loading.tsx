export default function ClientDetailLoading() {
  return (
    <div className="animate-pulse">
      {/* Back link */}
      <div className="h-4 bg-gray-200 rounded w-20 mb-6" />
      {/* Name heading */}
      <div className="h-8 bg-gray-200 rounded w-48 mb-2" />
      {/* Source badge */}
      <div className="h-5 bg-gray-200 rounded-full w-16 mb-6" />
      {/* Detail card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="h-4 bg-gray-200 rounded w-20" />
            <div className="h-4 bg-gray-200 rounded w-40" />
          </div>
        ))}
      </div>
    </div>
  )
}
