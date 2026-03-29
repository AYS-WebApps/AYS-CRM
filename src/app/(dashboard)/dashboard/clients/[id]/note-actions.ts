'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { NoteRow } from '@/lib/types'

export async function getNotesByClient(clientId: string): Promise<NoteRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function addNote(
  clientId: string,
  content: string,
  projectId: string | null
): Promise<{ success: true } | { error: string }> {
  if (!content.trim()) {
    return { error: 'Note cannot be empty.' }
  }
  if (content.trim().length > 2000) {
    return { error: 'Note must be 2000 characters or fewer.' }
  }

  const supabase = await createClient()

  // Verify projectId belongs to clientId before insert (prevents cross-client note injection)
  if (projectId) {
    const { data: proj } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('client_id', clientId)
      .maybeSingle()
    if (!proj) return { error: 'Project not found.' }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase.from('notes').insert({
    client_id: clientId,
    project_id: projectId,
    content: content.trim(),
    created_by: user?.id ?? null, // UUID FK to auth.users — not email
  })

  if (error) return { error: 'Failed to add note. Please try again.' }

  revalidatePath('/dashboard/clients/' + clientId)
  return { success: true }
}

export async function deleteNote(
  noteId: string,
  clientId: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient()

  // Dual-key delete: prevents deleting notes from other clients
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', noteId)
    .eq('client_id', clientId)

  if (error) return { error: 'Failed to delete note. Please try again.' }

  revalidatePath('/dashboard/clients/' + clientId)
  return { success: true }
}
