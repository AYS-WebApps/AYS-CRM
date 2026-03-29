export default function ClientsLoading() {
  return (
    <div className="animate-pulse">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 bg-gray-200 rounded w-24" />
        <div className="h-9 bg-gray-200 rounded w-28" />
      </div>
      {/* Search input */}
      <div className="h-10 bg-gray-200 rounded mb-4 w-full max-w-sm" />
      {/* Table rows */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="h-10 bg-gray-50 border-b border-gray-200" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 px-4 py-3 border-b border-gray-100 last:border-0">
            <div className="h-4 bg-gray-200 rounded w-32" />
            <div className="h-4 bg-gray-200 rounded w-24" />
            <div className="h-4 bg-gray-200 rounded w-40" />
            <div className="h-5 bg-gray-200 rounded-full w-16" />
            <div className="h-4 bg-gray-200 rounded w-24 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}
