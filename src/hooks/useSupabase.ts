'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Хук для получения Supabase клиента
 * Используется в client components
 */
export function useSupabase() {
  const [client, setClient] = useState<ReturnType<typeof createClient> | null>(null)

  useEffect(() => {
    // Создаём клиент только на клиенте
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    setClient(supabase)
  }, [])

  return client
}

/**
 * Функция для получения клиента вне React компонентов
 * Можно импортировать и использовать напрямую
 */
export const getSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey)
}

export default useSupabase
