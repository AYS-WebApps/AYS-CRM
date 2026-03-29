export default function AlertsLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6">
        <div className="h-7 bg-gray-200 rounded w-24 mb-2" />
        <div className="h-4 bg-gray-100 rounded w-56" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="h-3 bg-gray-100 rounded w-24 mb-2" />
                <div className="h-5 bg-gray-200 rounded w-48 mb-2" />
                <div className="h-4 bg-gray-100 rounded w-64" />
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="h-5 bg-gray-100 rounded-full w-20" />
                <div className="h-4 bg-gray-100 rounded w-28" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
