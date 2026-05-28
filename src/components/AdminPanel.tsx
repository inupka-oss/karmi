'use client'
import { useState, useEffect } from 'react'
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

  const handleLogout = () => {
    document.cookie = 'sb-access-token=; path=/; max-age=0'
    document.cookie = 'sb-refresh-token=; path=/; max-age=0'
    router.push('/admin/login')
  }

  const uploadPoster = async (file: File): Promise<string> => {
    const accessToken = getAccessToken()
    const res = await fetch(`${supabaseUrl}/storage/v1/object/posters/${file.name}`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': file.type,
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

  const toggleGenre = (genreId: number) => {
    setSelectedGenres(prev =>
      prev.includes(genreId) ? prev.filter(id => id !== genreId) : [...prev, genreId]
    )
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
      // Обновление аниме
      const res = await fetch(`${supabaseUrl}/rest/v1/anime?id=eq.${editingAnime.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${accessToken}`,
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(animeData),
      })
      if (!res.ok) { alert('Ошибка обновления'); setUploading(false); return }
      const updatedAnime = (await res.json())[0]

      // Удаляем старые связи с жанрами
      await fetch(`${supabaseUrl}/rest/v1/anime_genres?anime_id=eq.${editingAnime.id}`, {
        method: 'DELETE',
        headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${accessToken}` },
      })
      // Добавляем новые
      if (selectedGenres.length > 0) {
        await Promise.all(selectedGenres.map(genreId =>
          fetch(`${supabaseUrl}/rest/v1/anime_genres`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseAnonKey,
              'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ anime_id: editingAnime.id, genre_id: genreId }),
          })
        ))
      }

      setAnimeList(prev => prev.map(a => a.id === editingAnime.id ? { ...updatedAnime, genres: genres.filter(g => selectedGenres.includes(g.id)) } : a))
    } else {
      // Создание аниме
      const res = await fetch(`${supabaseUrl}/rest/v1/anime`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(animeData),
      })
      if (!res.ok) { alert('Ошибка создания'); setUploading(false); return }
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
    router.refresh()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить аниме и все его серии?')) return
    const accessToken = getAccessToken()
    await fetch(`${supabaseUrl}/rest/v1/anime_genres?anime_id=eq.${id}`, {
      method: 'DELETE',
      headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${accessToken}` },
    })
    await fetch(`${supabaseUrl}/rest/v1/episodes?anime_id=eq.${id}`, {
      method: 'DELETE',
      headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${accessToken}` },
    })
    const res = await fetch(`${supabaseUrl}/rest/v1/anime?id=eq.${id}`, {
      method: 'DELETE',
      headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${accessToken}` },
    })
    if (res.ok) {
      setAnimeList(prev => prev.filter(a => a.id !== id))
      if (expandedAnimeId === id) setExpandedAnimeId(null)
    } else alert('Ошибка удаления')
  }

  // Управление эпизодами
  const loadEpisodes = async (animeId: string) => {
    const accessToken = getAccessToken()
    const res = await fetch(`${supabaseUrl}/rest/v1/episodes?anime_id=eq.${animeId}&order=episode_number.asc`, {
      headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${accessToken}` },
    })
    if (res.ok) {
      const data = await res.json()
      setEpisodes(data)
    }
  }

  const handleAddEpisode = async (animeId: string) => {
    const accessToken = getAccessToken()
    const body = {
      anime_id: animeId,
      episode_number: episodeForm.episode_number,
      title: episodeForm.title || null,
      video_url: episodeForm.video_url,
    }
    const res = await fetch(`${supabaseUrl}/rest/v1/episodes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) { alert('Ошибка добавления серии'); return }
    await loadEpisodes(animeId)
    setEpisodeForm({ episode_number: episodeForm.episode_number + 1, title: '', video_url: '' })
  }

  const handleDeleteEpisode = async (episodeId: string, animeId: string) => {
    const accessToken = getAccessToken()
    await fetch(`${supabaseUrl}/rest/v1/episodes?id=eq.${episodeId}`, {
      method: 'DELETE',
      headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${accessToken}` },
    })
    await loadEpisodes(animeId)
  }

  const toggleEpisodesPanel = (animeId: string) => {
    if (expandedAnimeId === animeId) {
      setExpandedAnimeId(null)
      setEpisodes([])
    } else {
      setExpandedAnimeId(animeId)
      loadEpisodes(animeId)
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
          <button onClick={openAddModal} className="bg-neo-pink hover:bg-neo-pink/80 text-white px-4 py-2 rounded-xl transition">
            Добавить аниме
          </button>
          <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl transition">
            Выйти
          </button>
        </div>
      </div>

      {/* Статистика */}
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

      {/* Список аниме */}
      <div className="grid gap-4">
        {animeList.map(anime => (
          <div key={anime.id}>
            <div className="glass p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <div className="flex-1">
                <h3 className="font-bold text-lg text-white">{anime.title_ru}</h3>
                <div className="flex gap-2 flex-wrap mt-1">
                  {anime.genres?.map(g => (
                    <span key={g.slug} className="text-xs bg-neo-pink/20 text-neo-pink px-2 py-0.5 rounded-full">{g.name}</span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-4 mt-2 sm:mt-0">
                <span className="text-sm text-gray-400">{anime.type} / {anime.year}</span>
                <button onClick={() => toggleEpisodesPanel(anime.id)} className="bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-lg text-sm">
                  Серии
                </button>
                <button onClick={() => openEditModal(anime)} className="bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 hover:text-blue-300 px-3 py-1 rounded-lg text-sm transition">
                  Ред.
                </button>
                <button onClick={() => handleDelete(anime.id)} className="bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-300 px-3 py-1 rounded-lg text-sm transition">
                  Удалить
                </button>
              </div>
            </div>

            {/* Панель управления сериями */}
            {expandedAnimeId === anime.id && (
              <div className="mt-2 p-4 glass rounded-xl">
                <h4 className="text-lg font-semibold mb-2">Серии</h4>
                {episodes.length === 0 && <p className="text-gray-400 text-sm">Нет добавленных серий.</p>}
                <ul className="space-y-2 mb-4">
                  {episodes.map(ep => (
                    <li key={ep.id} className="flex justify-between items-center bg-white/5 p-2 rounded-lg">
                      <span className="text-white">{ep.episode_number}. {ep.title || 'Без названия'}</span>
                      <button onClick={() => handleDeleteEpisode(ep.id, anime.id)} className="text-red-400 hover:text-red-300 text-sm ml-4">Удалить</button>
                    </li>
                  ))}
                </ul>

                <div className="flex gap-2 items-end flex-wrap">
                  <input type="number" placeholder="№" value={episodeForm.episode_number} onChange={e => setEpisodeForm({...episodeForm, episode_number: Number(e.target.value)})}
                    className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white w-20" min={1} />
                  <input type="text" placeholder="Название (необязательно)" value={episodeForm.title} onChange={e => setEpisodeForm({...episodeForm, title: e.target.value})}
                    className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white flex-1" />
                  <input type="url" placeholder="Ссылка на видео (embed)" value={episodeForm.video_url} onChange={e => setEpisodeForm({...episodeForm, video_url: e.target.value})}
                    className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white flex-1" required />
                  <button onClick={() => handleAddEpisode(anime.id)} className="bg-neo-pink hover:bg-neo-pink/80 text-white px-4 py-2 rounded-xl">Добавить</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Модальное окно добавления/редактирования */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-neo-dark border border-white/10 rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4">
              {editingAnime ? 'Редактировать аниме' : 'Новое аниме'}
            </h2>
            <form onSubmit={handleSaveAnime} className="flex flex-col gap-3">
              <input placeholder="Название (рус)" value={titleRu} onChange={e => setTitleRu(e.target.value)} className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white" required />
              <input placeholder="Название (англ)" value={titleEn} onChange={e => setTitleEn(e.target.value)} className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white" />
              <textarea placeholder="Описание" value={description} onChange={e => setDescription(e.target.value)} rows={3} className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white" />
              <div className="flex gap-2">
                <input type="number" placeholder="Год" value={year} onChange={e => setYear(Number(e.target.value))} className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white w-1/2" />
                <input type="number" step="0.1" min="0" max="10" placeholder="Рейтинг" value={rating} onChange={e => setRating(Number(e.target.value))} className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white w-1/2" />
              </div>
              <div>
                <label className="text-sm text-gray-400">Постер (файл)</label>
                <input type="file" accept="image/*" onChange={e => setPosterFile(e.target.files?.[0] || null)} className="text-white text-sm mt-1" />
              </div>
              <input placeholder="Или URL постера" value={posterUrl} onChange={e => setPosterUrl(e.target.value)} className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white" />
              <select value={type} onChange={e => setType(e.target.value)} className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white">
                <option value="tv">TV Сериал</option>
                <option value="movie">Фильм</option>
                <option value="ova">OVA</option>
                <option value="ona">ONA</option>
                <option value="special">Спешл</option>
              </select>
              <select value={status} onChange={e => setStatus(e.target.value)} className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white">
                <option value="ongoing">Выходит</option>
                <option value="completed">Завершён</option>
                <option value="announced">Анонсирован</option>
              </select>
              <div>
                <p className="text-sm text-white mb-1">Жанры:</p>
                <div className="flex flex-wrap gap-2">
                  {genres.map(genre => (
                    <button type="button" key={genre.id} onClick={() => toggleGenre(genre.id)}
                      className={`px-2 py-1 rounded-full text-xs ${selectedGenres.includes(genre.id) ? 'bg-neo-pink text-white' : 'bg-white/10 text-white/70'}`}>
                      {genre.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => { setShowModal(false); resetForm() }} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl">Отмена</button>
                <button type="submit" disabled={uploading} className="bg-neo-pink hover:bg-neo-pink/80 text-white px-4 py-2 rounded-xl">
                  {uploading ? 'Загрузка...' : editingAnime ? 'Сохранить' : 'Добавить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}