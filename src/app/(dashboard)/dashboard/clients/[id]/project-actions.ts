'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { PipelineStageRow, ProjectWithStage } from '@/lib/types'

export async function getStages(): Promise<PipelineStageRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('pipeline_stages')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data
}

export async function getProjectsByClient(clientId: string): Promise<ProjectWithStage[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*, pipeline_stages(name, color)')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as ProjectWithStage[]
}

export async function createProject(
  clientId: string,
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const title = (formData.get('title') as string).trim()
  const event_date = (formData.get('event_date') as string).trim() || null

  if (!title) {
    return { error: 'Title is required.' }
  }

  const supabase = await createClient()

  // Resolve New Lead stage UUID — app invariant: new projects must always set this
  const { data: stage } = await supabase
    .from('pipeline_stages')
    .select('id')
    .ilike('name', 'New Lead')
    .maybeSingle()

  if (!stage?.id) {
    return { error: 'Pipeline stages are not configured. Please contact support.' }
  }

  const { error } = await supabase.from('projects').insert({
    client_id: clientId,
    title,
    event_date: event_date || null,
    pipeline_stage_id: stage.id,
  })

  if (error) {
    return { error: 'Failed to create project. Please try again.' }
  }

  revalidatePath(`/dashboard/clients/${clientId}`)
  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateProject(
  projectId: string,
  clientId: string,
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const title = (formData.get('title') as string).trim()
  const event_date = (formData.get('event_date') as string).trim() || null
  const pipeline_stage_id = (formData.get('pipeline_stage_id') as string).trim() || null
  const next_action = (formData.get('next_action') as string).trim() || null
  const next_action_due_at = (formData.get('next_action_due_at') as string).trim() || null

  if (!title) {
    return { error: 'Title is required.' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('projects')
    .update({ title, event_date, pipeline_stage_id, next_action, next_action_due_at })
    .eq('id', projectId)
    .eq('client_id', clientId)
    .select('id')

  if (error) {
    return { error: 'Failed to update project. Please try again.' }
  }

  if (!data || data.length === 0) {
    return { error: 'Project not found. It may have been deleted.' }
  }

  revalidatePath(`/dashboard/clients/${clientId}`)
  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteProject(
  projectId: string,
  clientId: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
    .eq('client_id', clientId)

  if (error) {
    return { error: 'Failed to delete project. Please try again.' }
  }

  revalidatePath(`/dashboard/clients/${clientId}`)
  revalidatePath('/dashboard')
  return { success: true }
}
