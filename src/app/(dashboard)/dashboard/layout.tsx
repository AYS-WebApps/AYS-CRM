import { logout } from '@/app/(auth)/login/actions'
import SidebarNav from '@/components/layout/SidebarNav'
import { getAlertCount } from './alerts/actions'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const alertCount = await getAlertCount()

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
        <aside className="w-56 min-h-[calc(100vh-3.5rem)] bg-white border-r border-gray-200 p-4">
          <SidebarNav alertCount={alertCount} />
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
