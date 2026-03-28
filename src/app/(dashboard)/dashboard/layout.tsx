import { logout } from '@/app/(auth)/login/actions'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <header className="bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-6 h-14">
          <span className="font-bold text-gray-900 text-lg">AYS CRM</span>
          <form action={logout}>
            <button
              type="submit"
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              Logout
            </button>
          </form>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar placeholder — navigation items added in Phase 2 */}
        <aside className="w-56 min-h-[calc(100vh-3.5rem)] bg-white border-r border-gray-200 p-4">
          <nav className="space-y-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-3 mb-2">
              Menu
            </p>
            <div className="text-sm text-gray-400 px-3 py-2">
              Navigation coming in Phase 2
            </div>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
