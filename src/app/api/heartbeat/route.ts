import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { animeId, userIdentifier } = await request.json()
  if (!animeId || !userIdentifier) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  const res = await fetch(`${supabaseUrl}/rest/v1/active_viewers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({
      anime_id: animeId,
      user_identifier: userIdentifier,
      last_seen: new Date().toISOString(),
    }),
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}