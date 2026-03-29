'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Client, ClientSource } from '@/lib/types'

const VALID_SOURCES: ClientSource[] = ['website', 'direct', 'referral', 'whatsapp', 'other']

export async function getClients(): Promise<Client[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data
}

export async function addClient(
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
  const { error } = await supabase.from('clients').insert({
    name,
    phone: phone || null,
    email: rawEmail || null,
    source,
  })

  if (error) {
    if (error.code === '23505') {
      return { error: 'A client with this email already exists.' }
    }
    console.error(`[CLIENTS] Insert error at ${new Date().toISOString()}:`, {
      code: error.code,
      message: error.message,
      // Never log PII
    })
    return { error: 'Something went wrong. Please try again.' }
  }

  revalidatePath('/dashboard/clients')
  revalidatePath('/dashboard')
  return { success: true }
}
