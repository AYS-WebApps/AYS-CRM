import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getStages } from './clients/[id]/project-actions'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const now = new Date().toISOString()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [clientRes, recentRes, attentionRes, stages, stageDataRes] = await Promise.all([
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase.from('clients').select('*', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo),
    supabase.from('projects').select('*', { count: 'exact', head: true }).not('next_action_due_at', 'is', null).lt('next_action_due_at', now),
    getStages(),
    supabase.from('projects').select('pipeline_stage_id'),
  ])

  const clientCount = clientRes.count
  const recentCount = recentRes.count
  const needsAttentionCount = attentionRes.count ?? 0
  const projectStageData = stageDataRes.data

  const stageCounts = stages.map((stage) => ({
    ...stage,
    count: projectStageData?.filter((p) => p.pipeline_stage_id === stage.id).length ?? 0,
  }))

  const stats: { label: string; value: string; description: string; href: string | null; highlight?: boolean }[] = [
    { label: 'Clients', value: String(clientCount ?? 0), description: 'Total clients', href: '/dashboard/clients' },
    { label: 'Recent Leads', value: String(recentCount ?? 0), description: 'Last 30 days', href: null },
    { label: 'Needs Attention', value: String(needsAttentionCount), description: 'Overdue next actions', href: '/dashboard/alerts', highlight: needsAttentionCount > 0 },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Welcome to AYS CRM</h1>
        <p className="text-sm text-gray-500 mt-1">Signed in as {user.email}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) =>
          stat.href ? (
            <Link
              key={stat.label}
              href={stat.href}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 transition-colors block"
            >
              <p className="text-sm text-gray-500">{stat.description}</p>
              <p className={`text-3xl font-bold mt-1 ${stat.highlight ? 'text-red-600' : 'text-gray-900'}`}>
                {stat.value}
              </p>
              <p className="text-sm font-medium text-gray-700 mt-1">{stat.label}</p>
            </Link>
          ) : (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-gray-200 p-5"
            >
              <p className="text-sm text-gray-500">{stat.description}</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
              <p className="text-sm font-medium text-gray-700 mt-1">{stat.label}</p>
            </div>
          )
        )}
      </div>

      {/* Pipeline Overview */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Pipeline Overview</h2>
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {stageCounts.map((stage) => (
            <div key={stage.id} className="flex items-center justify-between px-5 py-3">
              <span
                style={{ color: stage.color, backgroundColor: stage.color + '33' }}
                className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium"
              >
                {stage.name}
              </span>
              <span className="text-sm font-semibold text-gray-900">{stage.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
