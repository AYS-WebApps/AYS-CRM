'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Client, ClientSource } from '@/lib/types'

const VALID_SOURCES: ClientSource[] = ['website', 'direct', 'referral', 'whatsapp', 'other']

export async function getClient(id: string): Promise<Client | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .maybeSingle() // returns null (no error) when 0 rows found
  if (error) throw new Error(error.message)
  return data
}

export async function updateClient(
  id: string,
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const name = (formData.get('name') as string | null)?.trim() ?? ''
  const phone = (formData.get('phone') as string | null)?.trim() || null
  const rawEmail = (formData.get('email') as string | null)?.trim().toLowerCase() || null
  const rawSource = formData.get('source') as string | null

  // Validate name
  if (!name) {
    return { error: 'Name is required.' }
  }

  // Validate email format
  if (rawEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
    return { error: 'Please enter a valid email address.' }
  }

  // Normalize source
  const source: ClientSource = VALID_SOURCES.includes(rawSource as ClientSource)
    ? (rawSource as ClientSource)
    : 'direct'

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clients')
    .update({ name, phone: phone || null, email: rawEmail || null, source })
    .eq('id', id)
    .select('id')

  if (error) {
    if (error.code === '23505') {
      return { error: 'A client with this email already exists.' }
    }
    console.error(`[CLIENTS] Update error at ${new Date().toISOString()}:`, {
      code: error.code,
      message: error.message,
      // Never log PII
    })
    return { error: 'Something went wrong. Please try again.' }
  }

  // Guard: 0 rows affected means the client was deleted mid-session
  if (!data || data.length === 0) {
    return { error: 'Client not found. It may have been deleted.' }
  }

  revalidatePath('/dashboard/clients')
  revalidatePath(`/dashboard/clients/${id}`)
  return { success: true }
}

export async function deleteClient(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('clients').delete().eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/clients')
  revalidatePath('/dashboard')
  redirect('/dashboard/clients')
}
