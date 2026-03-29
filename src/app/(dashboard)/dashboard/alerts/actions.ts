'use server'

import { createClient } from '@/lib/supabase/server'
import type { AlertProject } from '@/lib/types'

export async function getAlerts(): Promise<AlertProject[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    .select('id, client_id, title, next_action, next_action_due_at, pipeline_stage_id, pipeline_stages(name, color), clients(id, name)')
    .not('next_action', 'is', null)
    .not('next_action_due_at', 'is', null)
    .order('next_action_due_at', { ascending: true })

  if (error) throw error
  // Supabase infers embedded relations as arrays; FK guarantees single object at runtime
  return data as unknown as AlertProject[]
}

export async function getAlertCount(): Promise<number> {
  const supabase = await createClient()
  const now = new Date().toISOString()
  const { count, error } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .not('next_action_due_at', 'is', null)
    .lt('next_action_due_at', now)

  // Never throw — used in layout; badge failure must not break page load
  if (error) return 0
  return count ?? 0
}
