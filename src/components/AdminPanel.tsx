'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'

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
  opening_start?: number
  opening_end?: number
  ending_start?: number
  ending_end?: number
}

interface RelatedAnime {
  id: string
  related_id: string
  relation_type: string
}

interface Screenshot {
  id: string
  url: string
  order_index: number
}

interface Comment {
  id: string
  anime_id: string
  user_name: string
  content: string
  created_at: string
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
  studio?: string
  director?: string
  cast?: string
  trailer_url?: string
  day_of_week?: number
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
  const [studio, setStudio] = useState('')
  const [director, setDirector] = useState('')
  const [cast, setCast] = useState('')
  const [trailerUrl, setTrailerUrl] = useState('')
  const [dayOfWeek, setDayOfWeek] = useState<number | undefined>(undefined)

  // Связанные аниме
  const [relatedEntries, setRelatedEntries] = useState<RelatedAnime[]>([])
  const [relatedType, setRelatedType] = useState('sequel')
  const [relatedTargetId, setRelatedTargetId] = useState('')

  // Эпизоды
  const [expandedAnimeId, setExpandedAnimeId] = useState<string | null>(null)
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [episodeForm, setEpisodeForm] = useState({
    episode_number: 1,
    title: '',
    video_url: '',
    opening_start: undefined as number | undefined,
    opening_end: undefined as number | undefined,
    ending_start: undefined as number | undefined,
    ending_end: undefined as number | undefined,
  })
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [uploadingVideo, setUploadingVideo] = useState(false)

  // Скриншоты
  const [screenshots, setScreenshots] = useState<Screenshot[]>([])
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null)
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false)

  // Комментарии
  const [comments, setComments] = useState<Comment[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editCommentText, setEditCommentText] = useState('')

  // Массовое добавление серий
  const [batchModalOpen, setBatchModalOpen] = useState(false)
  const [batchJson, setBatchJson] = useState('')
  const [batchAnimeId, setBatchAnimeId] = useState<string | null>(null)

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
    setStudio('')
    setDirector('')
    setCast('')
    setTrailerUrl('')
    setDayOfWeek(undefined)
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
    setStudio(anime.studio || '')
    setDirector(anime.director || '')
    setCast(anime.cast || '')
    setTrailerUrl(anime.trailer_url || '')
    setDayOfWeek(anime.day_of_week)
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
        toast.error('Ошибка загрузки постера')
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
      studio: studio || null,
      director: director || null,
      cast: cast || null,
      trailer_url: trailerUrl || null,
      day_of_week: dayOfWeek ?? null,
    }

    if (editingAnime) {
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
      if (!res.ok) { toast.error('Ошибка обновления'); setUploading(false); return }
      const updatedAnime = (await res.json())[0]
      toast.success('Аниме обновлено!')

      await fetch(`${supabaseUrl}/rest/v1/anime_genres?anime_id=eq.${editingAnime.id}`, {
        method: 'DELETE',
        headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${accessToken}` },
      })
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
      const res = await fetch(`${supabaseUrl}/rest/v1/anime`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(animeData),
      })
      if (!res.ok) { toast.error('Ошибка создания'); setUploading(false); return }
      const newAnime = await res.json()
      toast.success('Аниме добавлено!')

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
      toast.success('Аниме удалено')
      setAnimeList(prev => prev.filter(a => a.id !== id))
      if (expandedAnimeId === id) setExpandedAnimeId(null)
    } else toast.error('Ошибка удаления')
  }

  // Связанные аниме
  const loadRelated = async (animeId: string) => {
    const accessToken = getAccessToken()
    const res = await fetch(`${supabaseUrl}/rest/v1/related_anime?anime_id=eq.${animeId}`, {
      headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${accessToken}` },
    })
    if (res.ok) {
      const data = await res.json()
      setRelatedEntries(data)
    }
  }

  const handleAddRelated = async (animeId: string) => {
    if (!relatedTargetId) return
    const accessToken = getAccessToken()
    const res = await fetch(`${supabaseUrl}/rest/v1/related_anime`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        anime_id: animeId,
        related_id: relatedTargetId,
        relation_type: relatedType,
      }),
    })
    if (!res.ok) { toast.error('Ошибка добавления связи'); return }
    toast.success('Связь добавлена')
    await loadRelated(animeId)
    setRelatedTargetId('')
  }

  const handleDeleteRelated = async (relatedId: string, animeId: string) => {
    const accessToken = getAccessToken()
    await fetch(`${supabaseUrl}/rest/v1/related_anime?id=eq.${relatedId}`, {
      method: 'DELETE',
      headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${accessToken}` },
    })
    toast.success('Связь удалена')
    await loadRelated(animeId)
  }

  // Эпизоды
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
    const finalVideoUrl = episodeForm.video_url

    if (videoFile) {
      // Заглушка: пока файлы не загружаются
      toast.error('Загрузка файлов временно недоступна. Вставьте ссылку на видео.')
      return
    }

    if (finalVideoUrl) {
      await saveEpisode(animeId, finalVideoUrl)
    } else {
      toast.error('Введите ссылку или выберите видеофайл')
    }
  }

  const saveEpisode = async (animeId: string, videoUrl: string) => {
    const accessToken = getAccessToken()
    const body = {
      anime_id: animeId,
      episode_number: episodeForm.episode_number,
      title: episodeForm.title || null,
      video_url: videoUrl,
      opening_start: episodeForm.opening_start || null,
      opening_end: episodeForm.opening_end || null,
      ending_start: episodeForm.ending_start || null,
      ending_end: episodeForm.ending_end || null,
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
    if (!res.ok) { toast.error('Ошибка добавления серии'); return }
    toast.success('Серия добавлена!')
    await loadEpisodes(animeId)
    setEpisodeForm({
      episode_number: episodeForm.episode_number + 1,
      title: '',
      video_url: '',
      opening_start: undefined,
      opening_end: undefined,
      ending_start: undefined,
      ending_end: undefined,
    })
  }

  const handleDeleteEpisode = async (episodeId: string, animeId: string) => {
    const accessToken = getAccessToken()
    await fetch(`${supabaseUrl}/rest/v1/episodes?id=eq.${episodeId}`, {
      method: 'DELETE',
      headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${accessToken}` },
    })
    toast.success('Серия удалена')
    await loadEpisodes(animeId)
  }

  // Массовое добавление серий
  const handleBatchAdd = async () => {
    if (!batchAnimeId || !batchJson.trim()) return
    let episodes: any[]
    try {
      episodes = JSON.parse(batchJson)
      if (!Array.isArray(episodes)) throw new Error('Not array')
    } catch {
      toast.error('Невалидный JSON массив')
      return
    }

    const accessToken = getAccessToken()
    let added = 0
    for (const ep of episodes) {
      if (!ep.episode_number || !ep.video_url) continue
      const res = await fetch(`${supabaseUrl}/rest/v1/episodes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          anime_id: batchAnimeId,
          episode_number: ep.episode_number,
          title: ep.title || null,
          video_url: ep.video_url,
        }),
      })
      if (res.ok) added++
      else toast.error(`Ошибка на серии ${ep.episode_number}`)
    }
    toast.success(`Добавлено ${added} серий`)
    setBatchModalOpen(false)
    setBatchJson('')
    if (expandedAnimeId === batchAnimeId) loadEpisodes(batchAnimeId)
  }

  // Скриншоты
  const loadScreenshots = async (animeId: string) => {
    const accessToken = getAccessToken()
    const res = await fetch(`${supabaseUrl}/rest/v1/screenshots?anime_id=eq.${animeId}&order=order_index.asc`, {
      headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${accessToken}` },
    })
    if (res.ok) {
      const data = await res.json()
      setScreenshots(data)
    }
  }

  const handleAddScreenshot = async (animeId: string) => {
    if (!screenshotFile) return
    setUploadingScreenshot(true)
    try {
      const accessToken = getAccessToken()
      const res = await fetch(`${supabaseUrl}/storage/v1/object/screenshots/${screenshotFile.name}`, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': screenshotFile.type,
        },
        body: screenshotFile,
      })
      if (!res.ok) throw new Error('Upload failed')
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/screenshots/${screenshotFile.name}`

      await fetch(`${supabaseUrl}/rest/v1/screenshots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ anime_id: animeId, url: publicUrl, order_index: screenshots.length }),
      })
      toast.success('Скриншот загружен')
      await loadScreenshots(animeId)
    } catch (err) {
      toast.error('Ошибка загрузки скриншота')
    } finally {
      setUploadingScreenshot(false)
      setScreenshotFile(null)
    }
  }

  const handleDeleteScreenshot = async (screenshotId: string, animeId: string) => {
    const accessToken = getAccessToken()
    await fetch(`${supabaseUrl}/rest/v1/screenshots?id=eq.${screenshotId}`, {
      method: 'DELETE',
      headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${accessToken}` },
    })
    toast.success('Скриншот удалён')
    await loadScreenshots(animeId)
  }

  const moveScreenshot = async (screenshotId: string, direction: 'up' | 'down') => {
    const currentIndex = screenshots.findIndex(sc => sc.id === screenshotId)
    if (currentIndex === -1) return
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= screenshots.length) return

    const updatedScreenshots = [...screenshots]
    const temp = updatedScreenshots[currentIndex]
    updatedScreenshots[currentIndex] = updatedScreenshots[newIndex]
    updatedScreenshots[newIndex] = temp

    const accessToken = getAccessToken()
    await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/screenshots?id=eq.${updatedScreenshots[currentIndex].id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ order_index: currentIndex }),
      }),
      fetch(`${supabaseUrl}/rest/v1/screenshots?id=eq.${updatedScreenshots[newIndex].id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ order_index: newIndex }),
      }),
    ])

    setScreenshots(updatedScreenshots)
  }

  // Комментарии
  const loadComments = async (animeId: string) => {
    setLoadingComments(true)
    const accessToken = getAccessToken()
    const res = await fetch(`${supabaseUrl}/rest/v1/comments?anime_id=eq.${animeId}&order=created_at.desc`, {
      headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${accessToken}` },
    })
    if (res.ok) {
      const data = await res.json()
      setComments(data)
    }
    setLoadingComments(false)
  }

  const handleDeleteComment = async (commentId: string, animeId: string) => {
    if (!confirm('Удалить комментарий?')) return
    const accessToken = getAccessToken()
    await fetch(`${supabaseUrl}/rest/v1/comments?id=eq.${commentId}`, {
      method: 'DELETE',
      headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${accessToken}` },
    })
    toast.success('Комментарий удалён')
    loadComments(animeId)
  }

  const startEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id)
    setEditCommentText(comment.content)
  }

  const cancelEditComment = () => {
    setEditingCommentId(null)
    setEditCommentText('')
  }

  const saveComment = async (commentId: string, animeId: string) => {
    if (!editCommentText.trim()) {
      toast.error('Текст комментария не может быть пустым')
      return
    }
    const accessToken = getAccessToken()
    const res = await fetch(`${supabaseUrl}/rest/v1/comments?id=eq.${commentId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ content: editCommentText }),
    })
    if (!res.ok) {
      toast.error('Ошибка сохранения')
      return
    }
    toast.success('Комментарий обновлён')
    setEditingCommentId(null)
    setEditCommentText('')
    loadComments(animeId)
  }

  const toggleEpisodesPanel = (animeId: string) => {
    if (expandedAnimeId === animeId) {
      setExpandedAnimeId(null)
      setEpisodes([])
    } else {
      setExpandedAnimeId(animeId)
      loadEpisodes(animeId)
      loadRelated(animeId)
      loadScreenshots(animeId)
      loadComments(animeId)
    }
  }

  useEffect(() => {
    setAnimeList(initialAnime)
  }, [initialAnime])

  return (
    <div className="max-w-6xl mx-auto p-2 sm:p-4">
      <Toaster />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Админ-панель Karmi</h1>
          <p className="text-sm text-gray-400">Вы вошли как: {userEmail}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={openAddModal}
            className="bg-neo-pink hover:bg-neo-pink/80 text-white px-3 sm:px-4 py-2 rounded-xl text-sm sm:text-base transition animate-pulse-subtle"
          >
            Добавить аниме
          </button>
          <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-3 sm:px-4 py-2 rounded-xl text-sm sm:text-base transition">
            Выйти
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-4 sm:mb-6">
        <div className="glass p-3 sm:p-4 rounded-xl text-center">
          <div className="text-xl sm:text-2xl font-bold text-white">{stats.totalAnime}</div>
          <div className="text-xs sm:text-sm text-gray-400">Аниме</div>
        </div>
        <div className="glass p-3 sm:p-4 rounded-xl text-center">
          <div className="text-xl sm:text-2xl font-bold text-white">{stats.totalEpisodes}</div>
          <div className="text-xs sm:text-sm text-gray-400">Эпизодов</div>
        </div>
      </div>

      <div className="grid gap-2 sm:gap-4">
        {animeList.map(anime => (
          <div key={anime.id}>
            <div className="glass p-3 sm:p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <div className="flex-1">
                <h3 className="font-bold text-base sm:text-lg text-white">{anime.title_ru}</h3>
                <div className="flex gap-1 sm:gap-2 flex-wrap mt-1">
                  {anime.genres?.map(g => (
                    <span key={g.slug} className="text-xs bg-neo-pink/20 text-neo-pink px-2 py-0.5 rounded-full">{g.name}</span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mt-2 sm:mt-0">
                <span className="text-xs sm:text-sm text-gray-400">{anime.type} / {anime.year}</span>
                <div className="flex gap-1 sm:gap-2">
                  <button onClick={() => toggleEpisodesPanel(anime.id)} className="bg-white/10 hover:bg-white/20 text-white px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm">
                    Серии
                  </button>
                  <button onClick={() => openEditModal(anime)} className="bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm">
                    Ред.
                  </button>
                  <button onClick={() => handleDelete(anime.id)} className="bg-red-500/20 hover:bg-red-500/40 text-red-400 px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm">
                    Удалить
                  </button>
                  <button onClick={() => {
                    setBatchAnimeId(anime.id)
                    setBatchModalOpen(true)
                  }} className="bg-purple-500/20 hover:bg-purple-500/40 text-purple-400 px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm">
                    Массово
                  </button>
                </div>
              </div>
            </div>

            {expandedAnimeId === anime.id && (
              <div className="mt-2 p-3 sm:p-4 glass rounded-xl space-y-4 sm:space-y-6">
                {/* Серии */}
                <div>
                  <h4 className="text-base sm:text-lg font-semibold mb-2">Серии</h4>
                  {episodes.length === 0 && <p className="text-gray-400 text-xs sm:text-sm">Нет добавленных серий.</p>}
                  <ul className="space-y-2 mb-4">
                    {episodes.map(ep => (
                      <li key={ep.id} className="flex justify-between items-center bg-white/5 p-2 rounded-lg text-sm">
                        <span className="text-white">{ep.episode_number}. {ep.title || 'Без названия'}</span>
                        <button onClick={() => handleDeleteEpisode(ep.id, anime.id)} className="text-red-400 hover:text-red-300 text-xs sm:text-sm ml-2">Удалить</button>
                      </li>
                    ))}
                  </ul>

                  <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-end flex-wrap">
                    <input type="number" placeholder="№" value={episodeForm.episode_number} onChange={e => setEpisodeForm({...episodeForm, episode_number: Number(e.target.value)})}
                      className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm w-full sm:w-20" min={1} />
                    <input type="text" placeholder="Название (необязательно)" value={episodeForm.title} onChange={e => setEpisodeForm({...episodeForm, title: e.target.value})}
                      className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm flex-1 w-full sm:w-auto" />
                    
                    <div className="flex flex-col gap-1 w-full sm:w-auto">
                      <label className="text-xs text-gray-400">Видеофайл (до 2 ГБ)</label>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                        className="text-white text-xs file:mr-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-neo-pink/20 file:text-neo-pink hover:file:bg-neo-pink/40"
                      />
                    </div>

                    <input
                      type="url"
                      placeholder="Или ссылка на видео (embed)"
                      value={episodeForm.video_url}
                      onChange={e => setEpisodeForm({...episodeForm, video_url: e.target.value})}
                      className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm flex-1 w-full sm:w-auto"
                    />

                    <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
                      <input type="number" placeholder="Опенинг начало (сек)" value={episodeForm.opening_start ?? ''} onChange={e => setEpisodeForm({...episodeForm, opening_start: e.target.value ? Number(e.target.value) : undefined})}
                        className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm" />
                      <input type="number" placeholder="Опенинг конец (сек)" value={episodeForm.opening_end ?? ''} onChange={e => setEpisodeForm({...episodeForm, opening_end: e.target.value ? Number(e.target.value) : undefined})}
                        className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm" />
                      <input type="number" placeholder="Эндинг начало (сек)" value={episodeForm.ending_start ?? ''} onChange={e => setEpisodeForm({...episodeForm, ending_start: e.target.value ? Number(e.target.value) : undefined})}
                        className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm" />
                      <input type="number" placeholder="Эндинг конец (сек)" value={episodeForm.ending_end ?? ''} onChange={e => setEpisodeForm({...episodeForm, ending_end: e.target.value ? Number(e.target.value) : undefined})}
                        className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm" />
                    </div>

                    <button
                      onClick={() => handleAddEpisode(anime.id)}
                      disabled={uploadingVideo}
                      className="bg-neo-pink hover:bg-neo-pink/80 text-white px-3 sm:px-4 py-2 rounded-xl text-sm sm:text-base"
                    >
                      {uploadingVideo ? 'Загрузка...' : 'Добавить'}
                    </button>
                  </div>
                </div>

                {/* Связанные аниме */}
                <div>
                  <h4 className="text-base sm:text-lg font-semibold mb-2">Связанное</h4>
                  <ul className="space-y-2 mb-4 text-sm">
                    {relatedEntries.map(rel => {
                      const relatedAnime = animeList.find(a => a.id === rel.related_id)
                      return (
                        <li key={rel.id} className="flex justify-between items-center bg-white/5 p-2 rounded-lg">
                          <span className="text-white">{rel.relation_type}: {relatedAnime?.title_ru || 'Неизвестно'}</span>
                          <button onClick={() => handleDeleteRelated(rel.id, anime.id)} className="text-red-400 hover:text-red-300 text-xs sm:text-sm">Удалить</button>
                        </li>
                      )
                    })}
                  </ul>
                  <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-end">
                    <select value={relatedType} onChange={e => setRelatedType(e.target.value)} className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm w-full sm:w-auto">
                      <option value="sequel">Сиквел</option>
                      <option value="prequel">Приквел</option>
                      <option value="spin-off">Спин-офф</option>
                      <option value="movie">Фильм</option>
                      <option value="ova">OVA</option>
                      <option value="special">Спешл</option>
                      <option value="alternative">Альтернатива</option>
                    </select>
                    <select value={relatedTargetId} onChange={e => setRelatedTargetId(e.target.value)} className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm w-full sm:w-auto flex-1">
                      <option value="">Выберите аниме</option>
                      {animeList.filter(a => a.id !== anime.id).map(a => (
                        <option key={a.id} value={a.id}>{a.title_ru}</option>
                      ))}
                    </select>
                    <button onClick={() => handleAddRelated(anime.id)} className="bg-neo-pink hover:bg-neo-pink/80 text-white px-3 sm:px-4 py-2 rounded-xl text-sm sm:text-base">Добавить связь</button>
                  </div>
                </div>

                {/* Кадры */}
                <div>
                  <h4 className="text-base sm:text-lg font-semibold mb-2">Кадры</h4>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {screenshots.sort((a, b) => a.order_index - b.order_index).map((sc, idx) => (
                      <div key={sc.id} className="relative flex-shrink-0 w-20 h-14 rounded overflow-hidden group">
                        <img src={sc.url} className="object-cover w-full h-full" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1">
                          <button
                            onClick={() => moveScreenshot(sc.id, 'up')}
                            disabled={idx === 0}
                            className="text-white text-xs bg-black/50 rounded p-0.5 disabled:opacity-30"
                          >
                            ▲
                          </button>
                          <button
                            onClick={() => moveScreenshot(sc.id, 'down')}
                            disabled={idx === screenshots.length - 1}
                            className="text-white text-xs bg-black/50 rounded p-0.5 disabled:opacity-30"
                          >
                            ▼
                          </button>
                        </div>
                        <button onClick={() => handleDeleteScreenshot(sc.id, anime.id)} className="absolute top-0 right-0 bg-red-500/50 text-white text-xs p-0.5">×</button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 items-center mt-2">
                    <input type="file" accept="image/*" onChange={e => setScreenshotFile(e.target.files?.[0] || null)} className="text-white text-xs" />
                    <button onClick={() => handleAddScreenshot(anime.id)} disabled={uploadingScreenshot} className="bg-neo-pink text-white px-3 py-1 rounded-lg text-xs">
                      {uploadingScreenshot ? '...' : 'Загрузить'}
                    </button>
                  </div>
                </div>

                {/* Комментарии */}
                <div>
                  <h4 className="text-base sm:text-lg font-semibold mb-2">Комментарии</h4>
                  {loadingComments && <p className="text-gray-400 text-sm">Загрузка...</p>}
                  {!loadingComments && comments.length === 0 && <p className="text-gray-400 text-sm">Нет комментариев.</p>}
                  <ul className="space-y-2 mb-4">
                    {comments.map(c => (
                      <li key={c.id} className="flex justify-between items-start bg-white/5 p-2 rounded-lg text-sm">
                        <div className="flex-1">
                          <span className="text-white font-medium">{c.user_name}</span>
                          {editingCommentId === c.id ? (
                            <div className="mt-1">
                              <textarea
                                value={editCommentText}
                                onChange={e => setEditCommentText(e.target.value)}
                                className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm"
                                rows={2}
                              />
                              <div className="flex gap-2 mt-1">
                                <button onClick={() => saveComment(c.id, anime.id)} className="text-green-400 hover:text-green-300 text-xs">Сохранить</button>
                                <button onClick={cancelEditComment} className="text-gray-400 hover:text-gray-300 text-xs">Отмена</button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-gray-400 text-xs mt-1">{c.content}</p>
                          )}
                          <span className="text-gray-500 text-xs">{new Date(c.created_at).toLocaleDateString('ru-RU')}</span>
                        </div>
                        {editingCommentId !== c.id && (
                          <div className="flex gap-2 ml-2">
                            <button onClick={() => startEditComment(c)} className="text-blue-400 hover:text-blue-300 text-xs">Ред.</button>
                            <button onClick={() => handleDeleteComment(c.id, anime.id)} className="text-red-400 hover:text-red-300 text-xs">Удалить</button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Модальное окно добавления/редактирования аниме */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-neo-dark border border-white/10 rounded-2xl p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-4">
              {editingAnime ? 'Редактировать аниме' : 'Новое аниме'}
            </h2>
            <form onSubmit={handleSaveAnime} className="flex flex-col gap-3">
              <input placeholder="Название (рус)" value={titleRu} onChange={e => setTitleRu(e.target.value)} className="bg-white/10 border border-white/20 rounded-xl px-3 sm:px-4 py-2 text-white text-sm sm:text-base" required />
              <input placeholder="Название (англ)" value={titleEn} onChange={e => setTitleEn(e.target.value)} className="bg-white/10 border border-white/20 rounded-xl px-3 sm:px-4 py-2 text-white text-sm sm:text-base" />
              <textarea placeholder="Описание" value={description} onChange={e => setDescription(e.target.value)} rows={3} className="bg-white/10 border border-white/20 rounded-xl px-3 sm:px-4 py-2 text-white text-sm sm:text-base" />
              <div className="flex flex-col sm:flex-row gap-2">
                <input type="number" placeholder="Год" value={year} onChange={e => setYear(Number(e.target.value))} className="bg-white/10 border border-white/20 rounded-xl px-3 sm:px-4 py-2 text-white text-sm sm:text-base w-full sm:w-1/2" />
                <input type="number" step="0.1" min="0" max="10" placeholder="Рейтинг" value={rating} onChange={e => setRating(Number(e.target.value))} className="bg-white/10 border border-white/20 rounded-xl px-3 sm:px-4 py-2 text-white text-sm sm:text-base w-full sm:w-1/2" />
              </div>
              <input placeholder="Студия" value={studio} onChange={e => setStudio(e.target.value)} className="bg-white/10 border border-white/20 rounded-xl px-3 sm:px-4 py-2 text-white text-sm sm:text-base" />
              <input placeholder="Режиссёр" value={director} onChange={e => setDirector(e.target.value)} className="bg-white/10 border border-white/20 rounded-xl px-3 sm:px-4 py-2 text-white text-sm sm:text-base" />
              <textarea placeholder="Актёры / сэйю (через запятую)" value={cast} onChange={e => setCast(e.target.value)} rows={2} className="bg-white/10 border border-white/20 rounded-xl px-3 sm:px-4 py-2 text-white text-sm sm:text-base" />
              <input placeholder="URL трейлера (YouTube)" value={trailerUrl} onChange={e => setTrailerUrl(e.target.value)} className="bg-white/10 border border-white/20 rounded-xl px-3 sm:px-4 py-2 text-white text-sm sm:text-base" />
              <div>
                <label className="text-xs sm:text-sm text-gray-400">Постер (файл)</label>
                <input type="file" accept="image/*" onChange={e => setPosterFile(e.target.files?.[0] || null)} className="text-white text-xs sm:text-sm mt-1" />
              </div>
              <input placeholder="Или URL постера" value={posterUrl} onChange={e => setPosterUrl(e.target.value)} className="bg-white/10 border border-white/20 rounded-xl px-3 sm:px-4 py-2 text-white text-sm sm:text-base" />
              <select value={type} onChange={e => setType(e.target.value)} className="bg-white/10 border border-white/20 rounded-xl px-3 sm:px-4 py-2 text-white text-sm sm:text-base">
                <option value="tv">TV Сериал</option>
                <option value="movie">Фильм</option>
                <option value="ova">OVA</option>
                <option value="ona">ONA</option>
                <option value="special">Спешл</option>
              </select>
              <select value={status} onChange={e => setStatus(e.target.value)} className="bg-white/10 border border-white/20 rounded-xl px-3 sm:px-4 py-2 text-white text-sm sm:text-base">
                <option value="ongoing">Выходит</option>
                <option value="completed">Завершён</option>
                <option value="announced">Анонсирован</option>
              </select>
              <div>
                <label className="text-sm text-white mb-1">День выхода (для онгоингов)</label>
                <select
                  value={dayOfWeek ?? ''}
                  onChange={e => setDayOfWeek(e.target.value ? Number(e.target.value) : undefined)}
                  className="bg-white/10 border border-white/20 rounded-xl px-3 sm:px-4 py-2 text-white text-sm sm:text-base w-full"
                >
                  <option value="">Не указан</option>
                  <option value={1}>Понедельник</option>
                  <option value={2}>Вторник</option>
                  <option value={3}>Среда</option>
                  <option value={4}>Четверг</option>
                  <option value={5}>Пятница</option>
                  <option value={6}>Суббота</option>
                  <option value={0}>Воскресенье</option>
                </select>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-white mb-1">Жанры:</p>
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  {genres.map(genre => (
                    <button type="button" key={genre.id} onClick={() => toggleGenre(genre.id)}
                      className={`px-2 py-1 rounded-full text-xs ${selectedGenres.includes(genre.id) ? 'bg-neo-pink text-white' : 'bg-white/10 text-white/70'}`}>
                      {genre.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => { setShowModal(false); resetForm() }} className="bg-white/10 hover:bg-white/20 text-white px-3 sm:px-4 py-2 rounded-xl text-sm sm:text-base">Отмена</button>
                <button type="submit" disabled={uploading} className="bg-neo-pink hover:bg-neo-pink/80 text-white px-3 sm:px-4 py-2 rounded-xl text-sm sm:text-base">
                  {uploading ? 'Загрузка...' : editingAnime ? 'Сохранить' : 'Добавить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно массового добавления серий */}
      {batchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-neo-dark border border-white/10 rounded-2xl p-4 sm:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-4">Массовое добавление серий</h2>
            <p className="text-gray-400 text-sm mb-2">
              Вставьте JSON-массив объектов вида: {`[{ "episode_number": 1, "title": "Название", "video_url": "https://..." }]`}
            </p>
            <textarea
              value={batchJson}
              onChange={e => setBatchJson(e.target.value)}
              rows={10}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm mb-4"
              placeholder={`[{"episode_number": 1, "title": "", "video_url": ""}]`}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setBatchModalOpen(false)} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl">Отмена</button>
              <button onClick={handleBatchAdd} className="bg-neo-pink hover:bg-neo-pink/80 text-white px-4 py-2 rounded-xl">Добавить все</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}