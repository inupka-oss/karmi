import { NextResponse } from 'next/server'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const res = await fetch(`${supabaseUrl}/rest/v1/anime?select=id`, {
    headers: {
      'apikey': supabaseAnonKey,
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
  const anime: { id: string }[] = await res.json()
  if (anime.length === 0) {
    return NextResponse.json({ error: 'No anime found' }, { status: 404 })
  }
  const randomIndex = Math.floor(Math.random() * anime.length)
  return NextResponse.json({ id: anime[randomIndex].id })
}