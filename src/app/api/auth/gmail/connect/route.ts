import { NextResponse } from 'next/server'

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  if (!clientId || !appUrl) {
    return NextResponse.redirect(`${appUrl ?? ''}/dashboard/settings?error=missing_config`)
  }

  const redirectUri = `${appUrl}/api/auth/gmail/callback`

  // Generate CSRF state token (RFC 6749 §10.12)
  const state = crypto.randomUUID()

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/gmail.readonly')
  authUrl.searchParams.set('access_type', 'offline')
  authUrl.searchParams.set('prompt', 'consent') // always re-issue refresh_token
  authUrl.searchParams.set('state', state)

  // Store state in httpOnly cookie for validation in callback
  const response = NextResponse.redirect(authUrl.toString())
  response.cookies.set('oauth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 600, // 10 minutes — sufficient for OAuth flow completion
    path: '/',
  })
  return response
}
