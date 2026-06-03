'use client'
import { useEffect, useRef } from 'react'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Создаём единый экземпляр клиента
let globalClient: SupabaseClient | null = null

/**
 * Хук для получения Supabase клиента
 * Используется в client components
 */
export function useSupabase() {
  const clientRef = useRef<SupabaseClient | null>(null)

  useEffect(() => {
    if (!globalClient) {
      globalClient = createClient(supabaseUrl, supabaseAnonKey)
    }
    clientRef.current = globalClient
  }, [])

  return clientRef.current
}

/**
 * Функция для получения клиента вне React компонентов
 * Можно импортировать и использовать напрямую
 */
export const getSupabaseClient = () => {
  if (!globalClient) {
    globalClient = createClient(supabaseUrl, supabaseAnonKey)
  }
  return globalClient
}

export default useSupabase
