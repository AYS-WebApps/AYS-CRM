import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const settingsUrl = `${appUrl}/dashboard/settings`

  // Verify user is authenticated FIRST — fail fast before any external API calls.
  // RLS would block the DB insert anyway, but burns the one-time OAuth code if we wait.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    const response = NextResponse.redirect(`${appUrl}/login`)
    response.cookies.delete('oauth_state')
    return response
  }

  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const returnedState = searchParams.get('state')

  // Validate CSRF state parameter (RFC 6749 §10.12)
  const storedState = request.cookies.get('oauth_state')?.value
  if (!storedState || returnedState !== storedState) {
    const response = NextResponse.redirect(`${settingsUrl}?error=invalid_state`)
    response.cookies.delete('oauth_state')
    return response
  }

  if (error || !code) {
    const response = NextResponse.redirect(`${settingsUrl}?error=access_denied`)
    response.cookies.delete('oauth_state')
    return response
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    const response = NextResponse.redirect(`${settingsUrl}?error=missing_config`)
    response.cookies.delete('oauth_state')
    return response
  }

  const redirectUri = `${appUrl}/api/auth/gmail/callback`

  // Exchange authorization code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  const tokens = await tokenRes.json() as {
    access_token?: string
    refresh_token?: string
    expires_in?: number
    error?: string
  }

  if (!tokenRes.ok || !tokens.access_token || !tokens.refresh_token) {
    const response = NextResponse.redirect(`${settingsUrl}?error=token_exchange`)
    response.cookies.delete('oauth_state')
    return response
  }

  // Fetch the Gmail account email
  const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  })
  const userInfo = await userInfoRes.json() as { email?: string }

  if (!userInfo.email) {
    const response = NextResponse.redirect(`${settingsUrl}?error=no_email`)
    response.cookies.delete('oauth_state')
    return response
  }

  // Store credentials — delete existing row first (reconnect flow).
  // .neq('id', nil-UUID) matches ALL rows — intentional single-row pattern.
  await supabase.from('gmail_credentials').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  const { error: insertError } = await supabase.from('gmail_credentials').insert({
    email: userInfo.email,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    token_expiry: new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000).toISOString(),
  })

  if (insertError) {
    const response = NextResponse.redirect(`${settingsUrl}?error=db_error`)
    response.cookies.delete('oauth_state')
    return response
  }

  const response = NextResponse.redirect(`${settingsUrl}?connected=true`)
  response.cookies.delete('oauth_state')
  return response
}
