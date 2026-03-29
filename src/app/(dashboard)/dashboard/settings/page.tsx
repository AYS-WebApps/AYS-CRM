import { createClient } from '@/lib/supabase/server'
import type { GmailCredentialRow } from '@/lib/types/database'
import Link from 'next/link'

interface SettingsPageProps {
  searchParams: Promise<{ connected?: string; error?: string }>
}

const ERROR_MESSAGES: Record<string, string> = {
  access_denied: 'Gmail access was denied. Please try again and click "Allow".',
  token_exchange: 'Failed to complete the Gmail connection. Please try again.',
  missing_config: 'Gmail integration is not configured. Contact the administrator.',
  no_email: 'Could not retrieve your Gmail address. Please try again.',
  db_error: 'Connection succeeded but failed to save credentials. Please try again.',
  invalid_state: 'Connection attempt rejected for security reasons. Please try again.',
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const { connected, error } = await searchParams

  const supabase = await createClient()
  const { data: credential } = await supabase
    .from('gmail_credentials')
    .select('email, updated_at')
    .maybeSingle() as { data: Pick<GmailCredentialRow, 'email' | 'updated_at'> | null }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      {/* Gmail Integration */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Gmail Integration</h2>
        <p className="text-sm text-gray-500 mb-4">
          Connect a Gmail account to automatically capture quote requests from the
          &ldquo;Quote Requests&rdquo; label.
        </p>

        {/* Success feedback */}
        {connected === 'true' && (
          <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
            Gmail account connected successfully.
          </div>
        )}

        {/* Error feedback */}
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
            {ERROR_MESSAGES[error] ?? 'An unexpected error occurred. Please try again.'}
          </div>
        )}

        {credential ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Connected</p>
              <p className="text-sm text-gray-500">{credential.email}</p>
            </div>
            <Link
              href="/api/auth/gmail/connect"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Reconnect
            </Link>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">No Gmail account connected.</p>
            <Link
              href="/api/auth/gmail/connect"
              className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-lg hover:bg-sky-700 transition-colors"
            >
              Connect Gmail
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}
