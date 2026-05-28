'use client'
import { useRouter } from 'next/navigation'

export default function AdminPanel({ userEmail }: { userEmail: string }) {
  const router = useRouter()

  const handleLogout = () => {
    // Удаляем куки
    document.cookie = 'sb-access-token=; path=/; max-age=0'
    document.cookie = 'sb-refresh-token=; path=/; max-age=0'
    router.push('/admin/login')
  }

  const handleAddAnime = () => {
    // Пока просто выводим alert, потом подключим форму
    alert('Функция добавления аниме появится позже')
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Админ-панель Карми</h1>
          <p className="text-gray-400">Вы вошли как: {userEmail}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleAddAnime}
            className="bg-neo-pink hover:bg-neo-pink/80 text-white px-4 py-2 rounded-xl"
          >
            Добавить аниме
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl"
          >
            Выйти
          </button>
        </div>
      </div>
      <p className="text-white">Список аниме (пока пусто)</p>
    </div>
  )
}