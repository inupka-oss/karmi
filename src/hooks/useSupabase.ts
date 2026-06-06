'use client'
import { useState, useEffect, useMemo } from 'react'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

let cachedClient: SupabaseClient | null = null

export function useSupabase() {
  const [isReady, setIsReady] = useState(false)

  const supabase = useMemo(() => {
    if (!cachedClient) {
      cachedClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      })
    }
    return cachedClient
  }, [])

  useEffect(() => {
    setIsReady(true)
  }, [])

  return { supabase, isReady }
}
