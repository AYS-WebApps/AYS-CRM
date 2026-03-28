import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const stats = [
    { label: 'Clients', value: '0', description: 'Total clients' },
    { label: 'Pipeline', value: '0', description: 'Active leads' },
    { label: 'Recent Leads', value: '0', description: 'Last 30 days' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Welcome to AYS CRM</h1>
        <p className="text-sm text-gray-500 mt-1">Signed in as {user.email}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-gray-200 p-5"
          >
            <p className="text-sm text-gray-500">{stat.description}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
            <p className="text-sm font-medium text-gray-700 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <p className="text-sm text-gray-400 mt-8">
        Data will appear here as you add clients and leads in Phase 2.
      </p>
    </div>
  )
}
