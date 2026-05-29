import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import ProfileClient from '@/components/ProfileClient'

export const dynamic = 'force-dynamic'

function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c =>
      '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    ).join(''))
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

export default async function ProfilePage() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('sb-access-token')?.value

  if (!accessToken) {
    redirect('/login')
  }

  // Извлекаем email из токена
  const payload = parseJwt(accessToken)
  const email = payload?.email || 'Пользователь'

  return <ProfileClient email={email} accessToken={accessToken} />
}