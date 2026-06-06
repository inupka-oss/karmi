/**
 * Утилиты для работы с аутентификацией
 * Централизованное управление токенами и идентификаторами
 */

/**
 * Получает access токен из cookies
 * @returns токен или null если не найден
 */
export function getAccessToken(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/sb-access-token=([^;]+)/)
  return match ? match[1] : null
}

/**
 * Получает или создаёт уникальный идентификатор пользователя
 * Для анонимных пользователей хранится в localStorage
 * @returns уникальный идентификатор
 */
export function getUserIdentifier(): string {
  if (typeof localStorage === 'undefined') return ''
  
  let id = localStorage.getItem('karmi-user-id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('karmi-user-id', id)
  }
  return id
}

/**
 * Проверяет авторизацию пользователя
 * @returns true если пользователь авторизован
 */
export function isAuthenticated(): boolean {
  return getAccessToken() !== null
}

/**
 * Получает данные авторизованного пользователя
 * @param supabaseUrl URL Supabase
 * @param supabaseAnonKey публичный ключ Supabase
 * @returns данные пользователя или null
 */
export async function getCurrentUser(
  supabaseUrl: string,
  supabaseAnonKey: string
): Promise<{ id: string; email: string } | null> {
  const token = getAccessToken()
  if (!token) return null

  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}
