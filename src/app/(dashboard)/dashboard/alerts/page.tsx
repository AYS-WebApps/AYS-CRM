import Link from 'next/link'
import { getAlerts } from './actions'
import type { AlertProject } from '@/lib/types'

function formatDate(dateString: string): string {
  const d = dateString.includes('T')
    ? new Date(dateString)
    : new Date(dateString + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default async function AlertsPage() {
  const alerts = await getAlerts()
  const now = new Date().toISOString()

  function isOverdue(due: string) {
    return due < now
  }

  if (alerts.length === 0) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Alerts</h1>
          <p className="text-sm text-gray-500 mt-1">Projects needing your attention, sorted by due date</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <p className="text-gray-900 font-medium mb-1">No next actions scheduled</p>
          <p className="text-sm text-gray-500 mb-4">Add a next action to a project to see it here.</p>
          <Link
            href="/dashboard/clients"
            className="inline-block px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Go to Clients
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Alerts</h1>
        <p className="text-sm text-gray-500 mt-1">Projects needing your attention, sorted by due date</p>
      </div>

      <div className="space-y-3">
        {alerts.map((alert: AlertProject) => {
          const overdue = isOverdue(alert.next_action_due_at)
          const stage = alert.pipeline_stages
          return (
            <div
              key={alert.id}
              className="bg-white rounded-xl border border-gray-200 p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <Link
                    href={`/dashboard/clients/${alert.client_id}`}
                    className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {alert.clients.name}
                  </Link>
                  <p className="font-semibold text-gray-900 mt-0.5">{alert.title}</p>
                  <p className="text-sm text-gray-700 mt-1">{alert.next_action}</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {stage && (
                    <span
                      style={{ color: stage.color, backgroundColor: stage.color + '33' }}
                      className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
                    >
                      {stage.name}
                    </span>
                  )}
                  <p className={overdue ? 'text-sm font-medium text-red-600' : 'text-sm text-gray-500'}>
                    {formatDate(alert.next_action_due_at)}{overdue ? ' — Overdue' : ''}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
