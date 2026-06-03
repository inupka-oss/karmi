/**
 * Supabase клиент для использования в браузере
 * Можно импортировать в компоненты и хуки
 */

import { createClient as createBrowserClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Создаём единый экземпляр клиента
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// Экспортируем функцию для создания нового клиента (если нужно)
export const createClient = () => {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

export default supabase
