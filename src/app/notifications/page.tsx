'use client'
import { useNotifications } from '@/hooks/useNotifications'
import Link from 'next/link'

export default function NotificationsPage() {
  const { newEpisodes } = useNotifications()

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 text-white">
      <h1 className="text-3xl font-bold mb-6">Уведомления</h1>
      {newEpisodes.length === 0 && <p className="text-gray-400">Нет новых уведомлений.</p>}
      <ul className="space-y-3">
        {newEpisodes.map((ep, idx) => (
          <li key={idx} className="glass p-3 rounded-xl flex justify-between items-center">
            <span>Новая серия: <Link href={`/anime/${ep.animeId}`} className="text-neo-pink font-medium">{ep.title}</Link></span>
          </li>
        ))}
      </ul>
    </div>
  )
}