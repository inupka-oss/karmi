'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface Genre {
  id: number
  name: string
  slug: string
}

interface Episode {
  id: string
  anime_id: string
  episode_number: number
  title?: string
  video_url: string
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

export default function AdminPanel({ userEmail, genres, initialAnime, stats }: {
  userEmail: string
  genres: Genre[]
  initialAnime: Anime[]
  stats: { totalAnime: number; totalEpisodes: number }
}) {
  const router = useRouter()
  const [animeList, setAnimeList] = useState<Anime[]>(initialAnime)
  const [showModal, setShowModal] = useState(false)
  const [editingAnime, setEditingAnime] = useState<Anime | null>(null)
  const [selectedGenres, setSelectedGenres] = useState<number[]>([])
  const [titleRu, setTitleRu] = useState('')
  const [titleEn, setTitleEn] = useState('')
  const [description, setDescription] = useState('')
  const [year, setYear] = useState(new Date().getFullYear())
  const [rating, setRating] = useState(7.5)
  const [type, setType] = useState('tv')
  const [status, setStatus] = useState('ongoing')
  const [posterFile, setPosterFile] = useState<File | null>(null)
  const [posterUrl, setPosterUrl] = useState('')
  const [uploading, setUploading] = useState(false)

  const [expandedAnimeId, setExpandedAnimeId] = useState<string | null>(null)
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [episodeForm, setEpisodeForm] = useState({ episode_number: 1, title: '', video_url: '' })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const getAccessToken = () => {
    const match = document.cookie.match(/sb-access-token=([^;]+)/)
    return match ? match[1] : ''
  }

  const uploadPoster = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('bucket', 'posters')
    const res = await fetch(`${supabaseUrl}/storage/v1/object/posters/${file.name}`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${getAccessToken()}`,
      },
      body: file,
    })
    if (!res.ok) throw new Error('Upload failed')
    return `${supabaseUrl}/storage/v1/object/public/posters/${file.name}`
  }

  const resetForm = () => {
    setTitleRu('')
    setTitleEn('')
    setDescription('')
    setYear(new Date().getFullYear())
    setRating(7.5)
    setType('tv')
    setStatus('ongoing')
    setPosterFile(null)
    setPosterUrl('')
    setSelectedGenres([])
    setEditingAnime(null)
  }

  const openAddModal = () => {
    resetForm()
    setShowModal(true)
  }

  const openEditModal = (anime: Anime) => {
    setEditingAnime(anime)
    setTitleRu(anime.title_ru)
    setTitleEn(anime.title_en || '')
    setDescription(anime.description || '')
    setYear(anime.year || new Date().getFullYear())
    setRating(anime.rating || 7.5)
    setType(anime.type || 'tv')
    setStatus(anime.status || 'ongoing')
    setPosterUrl(anime.poster_url || '')
    const currentGenreIds = anime.genres ? anime.genres.map(g => g.id) : []
    setSelectedGenres(currentGenreIds)
    setShowModal(true)
  }

  const handleSaveAnime = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)
    let finalPosterUrl = posterUrl
    if (posterFile) {
      try {
        finalPosterUrl = await uploadPoster(posterFile)
      } catch (err) {
        alert('Ошибка загрузки постера')
        setUploading(false)
        return
      }
    }

    const accessToken = getAccessToken()
    const animeData = {
      title_ru: titleRu,
      title_en: titleEn || null,
      description,
      year,
      rating,
      poster_url: finalPosterUrl || null,
      type,
      status,
    }

    if (editingAnime) {
      await fetch(`${supabaseUrl}/rest/v1/anime?id=eq.${editingAnime.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${accessToken}`,
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(animeData),
      })
      // ... остальная логика жанров как ранее (удаление/вставка)
    } else {
      const res = await fetch(`${supabaseUrl}/rest/v1/anime`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(animeData),
      })
      const newAnime = await res.json()
      if (selectedGenres.length > 0) {
        await Promise.all(selectedGenres.map(genreId =>
          fetch(`${supabaseUrl}/rest/v1/anime_genres`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseAnonKey,
              'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ anime_id: newAnime.id, genre_id: genreId }),
          })
        ))
      }
      setAnimeList(prev => [{ ...newAnime, genres: genres.filter(g => selectedGenres.includes(g.id)) }, ...prev])
    }
    setShowModal(false)
    resetForm()
    setUploading(false)
    // Обновить страницу для получения свежих данных
    router.refresh()
  }

  // Остальные функции (handleDelete, loadEpisodes и т.д.) остаются без изменений, 
  // я их сократил для краткости, но в реальном коде они должны присутствовать.
  // Полный код AdminPanel будет очень длинным, я дал ключевые изменения.

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Админ-панель Карми</h1>
          <p className="text-gray-400">Вы вошли как: {userEmail}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={openAddModal} className="bg-neo-pink hover:bg-neo-pink/80 text-white px-4 py-2 rounded-xl transition">
            Добавить аниме
          </button>
          <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl transition">
            Выйти
          </button>
        </div>
      </div>

      {/* Блок статистики */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="glass p-4 rounded-xl text-center">
          <div className="text-2xl font-bold text-white">{stats.totalAnime}</div>
          <div className="text-gray-400">Аниме</div>
        </div>
        <div className="glass p-4 rounded-xl text-center">
          <div className="text-2xl font-bold text-white">{stats.totalEpisodes}</div>
          <div className="text-gray-400">Эпизодов</div>
        </div>
      </div>

      {/* Список аниме и остальное... */}
      {/* Здесь должен быть полный код, аналогичный предыдущему, но с добавленной загрузкой файла */}
    </div>
  )
}