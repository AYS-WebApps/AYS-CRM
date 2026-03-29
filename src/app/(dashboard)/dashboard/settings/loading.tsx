export default function SettingsLoading() {
  return (
    <div className="max-w-2xl">
      <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-6" />
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="h-4 w-40 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-4 w-72 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="flex items-center justify-between">
          <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-9 w-28 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  )
}
