import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import AdminPanel from '@/components/AdminPanel'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const cookieStore = cookies()
  const accessToken = cookieStore.get('sb-access-token')?.value

  if (!accessToken) {
    redirect('/admin/login')
  }

  // Получаем email пользователя через Supabase Auth API (или можно просто токен декодировать)
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    },
  })

  if (!res.ok) {
    redirect('/admin/login')
  }

  const user = await res.json()

  // Здесь можно загрузить список аниме (пока оставим пустым)
  return <AdminPanel userEmail={user.email} />
}