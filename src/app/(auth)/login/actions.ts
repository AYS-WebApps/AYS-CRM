'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Basic validation — avoid unnecessary API calls on empty fields
  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    // Auth failure (wrong credentials, user not found, etc.)
    if (
      error.message.toLowerCase().includes('invalid') ||
      error.message.toLowerCase().includes('credentials') ||
      error.message.toLowerCase().includes('not found') ||
      error.status === 400
    ) {
      return { error: 'Invalid email or password.' }
    }

    // Unexpected error (network, service unavailable, etc.)
    console.error(`[AUTH] Login error at ${new Date().toISOString()}:`, {
      errorCode: error.status,
      errorMessage: error.message,
      // Never log email or password
    })
    return { error: 'Something went wrong, please try again.' }
  }

  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
