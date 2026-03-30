import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types'

// Runs daily via Vercel Cron.
// Finds all "Signed" projects whose event_date has passed and marks them "Completed".
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Direct client (no cookie auth needed — this is a server-to-server cron call)
  const supabase = createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Resolve stage IDs
  const [{ data: signedStage }, { data: completedStage }] = await Promise.all([
    supabase.from('pipeline_stages').select('id').ilike('name', 'Signed').maybeSingle(),
    supabase.from('pipeline_stages').select('id').ilike('name', 'Completed').maybeSingle(),
  ])

  if (!signedStage?.id || !completedStage?.id) {
    return NextResponse.json({ error: 'Pipeline stages not configured' }, { status: 500 })
  }

  // today in YYYY-MM-DD (UTC) — event_date is a DATE column
  const today = new Date().toISOString().split('T')[0]

  const { data: updated, error } = await supabase
    .from('projects')
    .update({ pipeline_stage_id: completedStage.id })
    .eq('pipeline_stage_id', signedStage.id)
    .lt('event_date', today)
    .not('event_date', 'is', null)
    .select('id, title')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    updated: updated?.length ?? 0,
    projects: updated?.map((p) => p.title) ?? [],
  })
}
