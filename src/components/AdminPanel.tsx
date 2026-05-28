'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Genre {
  id: number
  name: string
  slug: string
}

interface Anime {
  id: string
  title_ru: string
  title_en?: string
  description?: string
  year?: number
  rating?: number
  poster_url?: string
  type?: string
  status?: string
  genres?: Genre[]
}

export default function AdminPanel({ userEmail, genres, initialAnime }: {
  userEmail: string
  genres: Genre[]
  initialAnime: Anime[]
}) {
  const router = useRouter()
  const [animeList, setAnimeList] = useState<Anime[]>(initialAnime)
  const [showModal, setShowModal] = useState(false)
  const [selectedGenres, setSelectedGenres] = useState<number[]>([])

  // Поля формы
  const [titleRu, setTitleRu] = useState('')
  const [titleEn, setTitleEn] = useState('')
  const [description, setDescription] = useState('')
  const [year, setYear] = useState(new Date().getFullYear())
  const [rating, setRating] = useState(7.5)
  const [type, setType] = useState('tv')
  const [status, setStatus] = useState('ongoing')
  const [posterUrl, setPosterUrl] = useState('')

  const resetForm = () => {
    setTitleRu('')
    setTitleEn('')
    setDescription('')
    setYear(new Date().getFullYear())
    setRating(7.5)
    setType('tv')
    setStatus('ongoing')
    setPosterUrl('')
    setSelectedGenres([])
  }

  const getAccessToken = () => {
    const match = document.cookie.match(/sb-access-token=([^;]+)/)
    return match ? match[1] : ''
  }

  const handleLogout = () => {
    document.cookie = 'sb-access-token=; path=/; max-age=0'
    document.cookie = 'sb-refresh-token=; path=/; max-age=0'
    router.push('/admin/login')
  }

  const toggleGenre = (genreId: number) => {
    setSelectedGenres(prev =>
      prev.includes(genreId) ? prev.filter(id => id !== genreId) : [...prev, genreId]
    )
  }

  const handleSaveAnime = async (e: React.FormEvent) => {
    e.preventDefault()
    const accessToken = getAccessToken()

    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/anime`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        title_ru: titleRu,
        title_en: titleEn || null,
        description,
        year,
        rating,
        poster_url: posterUrl || null,
        type,
        status,
      }),
    })
    if (!res.ok) {
      alert('Ошибка создания аниме')
      return
    }
    const newAnime = await res.json()

    if (selectedGenres.length > 0) {
      await Promise.all(
        selectedGenres.map(genreId =>
          fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/anime_genres`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ anime_id: newAnime.id, genre_id: genreId }),
          })
        )
      )
    }

    const newAnimeWithGenres = {
      ...newAnime,
      genres: genres.filter(g => selectedGenres.includes(g.id)),
    }
    setAnimeList(prev => [newAnimeWithGenres, ...prev])
    setShowModal(false)
    resetForm()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить это аниме?')) return

    const accessToken = getAccessToken()
    // Удаляем связи с жанрами
    await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/anime_genres?anime_id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    // Удаляем само аниме
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/anime?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    if (res.ok) {
      setAnimeList(prev => prev.filter(anime => anime.id !== id))
    } else {
      alert('Ошибка при удалении')
    }
  }

  useEffect(() => {
    setAnimeList(initialAnime)
  }, [initialAnime])

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Админ-панель Карми</h1>
          <p className="text-gray-400">Вы вошли как: {userEmail}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowModal(true)}
            className="bg-neo-pink hover:bg-neo-pink/80 text-white px-4 py-2 rounded-xl transition"
          >
            Добавить аниме
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl transition"
          >
            Выйти
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {animeList.map(anime => (
          <div key={anime.id} className="glass p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div className="flex-1">
              <h3 className="font-bold text-lg text-white">{anime.title_ru}</h3>
              <div className="flex gap-2 flex-wrap mt-1">
                {anime.genres?.map(g => (
                  <span key={g.slug} className="text-xs bg-neo-pink/20 text-neo-pink px-2 py-0.5 rounded-full">
                    {g.name}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4 mt-2 sm:mt-0">
              <span className="text-sm text-gray-400">{anime.type} / {anime.year}</span>
              <button
                onClick={() => handleDelete(anime.id)}
                className="bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-300 px-3 py-1 rounded-lg text-sm transition"
              >
                Удалить
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-neo-dark border border-white/10 rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4">Новое аниме</h2>
            <form onSubmit={handleSaveAnime} className="flex flex-col gap-3">
              <input
                placeholder="Название (рус)"
                value={titleRu}
                onChange={e => setTitleRu(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white"
                required
              />
              <input
                placeholder="Название (англ)"
                value={titleEn}
                onChange={e => setTitleEn(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white"
              />
              <textarea
                placeholder="Описание"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Год"
                  value={year}
                  onChange={e => setYear(Number(e.target.value))}
                  className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white w-1/2"
                />
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  placeholder="Рейтинг"
                  value={rating}
                  onChange={e => setRating(Number(e.target.value))}
                  className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white w-1/2"
                />
              </div>
              <input
                placeholder="URL постера"
                value={posterUrl}
                onChange={e => setPosterUrl(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white"
              />
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white"
              >
                <option value="tv">TV Сериал</option>
                <option value="movie">Фильм</option>
                <option value="ova">OVA</option>
                <option value="ona">ONA</option>
                <option value="special">Спешл</option>
              </select>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white"
              >
                <option value="ongoing">Выходит</option>
                <option value="completed">Завершён</option>
                <option value="announced">Анонсирован</option>
              </select>

              <div>
                <p className="text-sm text-white mb-1">Жанры:</p>
                <div className="flex flex-wrap gap-2">
                  {genres.map(genre => (
                    <button
                      type="button"
                      key={genre.id}
                      onClick={() => toggleGenre(genre.id)}
                      className={`px-2 py-1 rounded-full text-xs ${
                        selectedGenres.includes(genre.id)
                          ? 'bg-neo-pink text-white'
                          : 'bg-white/10 text-white/70'
                      }`}
                    >
                      {genre.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm() }}
                  className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="bg-neo-pink hover:bg-neo-pink/80 text-white px-4 py-2 rounded-xl"
                >
                  Добавить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}