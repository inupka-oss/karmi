'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import * as Dialog from '@radix-ui/react-dialog'

export default function DashboardClient({ animeList, genresList }: { animeList: any[], genresList: any[] }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  const handleDelete = async (id: string) => {
    if (confirm('Удалить аниме?')) {
      const { error } = await supabase.from('anime').delete().eq('id', id)
      if (error) toast.error('Ошибка удаления')
      else {
        toast.success('Удалено')
        router.refresh()
      }
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Toaster />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Админ-панель Карми</h1>
        <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl">Выйти</button>
      </div>
      <button onClick={() => setOpen(true)} className="bg-neo-pink hover:bg-neo-pink/80 text-white px-4 py-2 rounded-xl mb-6">Добавить аниме</button>

      <AddAnimeDialog open={open} onOpenChange={setOpen} genresList={genresList} />

      <div className="grid gap-4">
        {animeList.map((anime) => (
          <div key={anime.id} className="glass p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <h3 className="font-bold text-lg">{anime.title_ru}</h3>
              <div className="flex gap-2 flex-wrap mt-1">
                {anime.genres?.map((g: any) => <span key={g.slug} className="text-xs bg-neo-pink/20 text-neo-pink px-2 py-0.5 rounded-full">{g.name}</span>)}
              </div>
            </div>
            <div className="flex gap-2 mt-2 sm:mt-0">
              <button onClick={() => handleDelete(anime.id)} className="bg-red-500/20 text-red-400 hover:bg-red-500/30 px-3 py-1 rounded-lg text-sm">Удалить</button>
              <button className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg text-sm">Эпизоды</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function AddAnimeDialog({ open, onOpenChange, genresList }: { open: boolean, onOpenChange: (open: boolean) => void, genresList: any[] }) {
  const supabase = createClient()
  const router = useRouter()
  const [titleRu, setTitleRu] = useState('')
  const [titleEn, setTitleEn] = useState('')
  const [description, setDescription] = useState('')
  const [year, setYear] = useState(new Date().getFullYear())
  const [rating, setRating] = useState(7.5)
  const [type, setType] = useState('tv')
  const [status, setStatus] = useState('ongoing')
  const [posterUrl, setPosterUrl] = useState('')
  const [selectedGenres, setSelectedGenres] = useState<number[]>([])

  const handleGenreToggle = (genreId: number) => {
    setSelectedGenres(prev => prev.includes(genreId) ? prev.filter(id => id !== genreId) : [...prev, genreId])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: anime, error } = await supabase.from('anime').insert({
      title_ru: titleRu,
      title_en: titleEn || null,
      description,
      year,
      rating,
      poster_url: posterUrl || null,
      type,
      status
    }).select().single()
    if (error) {
      toast.error('Ошибка создания аниме')
      return
    }
    if (selectedGenres.length > 0) {
      const genreInserts = selectedGenres.map(genreId => ({ anime_id: anime.id, genre_id: genreId }))
      await supabase.from('anime_genres').insert(genreInserts)
    }
    toast.success('Аниме добавлено!')
    onOpenChange(false)
    router.refresh()
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-neo-dark border border-white/10 rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
          <Dialog.Title className="text-xl font-bold mb-4">Новое аниме</Dialog.Title>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input placeholder="Название (рус)" value={titleRu} onChange={e => setTitleRu(e.target.value)} className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white" required />
            <input placeholder="Название (англ)" value={titleEn} onChange={e => setTitleEn(e.target.value)} className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white" />
            <textarea placeholder="Описание" value={description} onChange={e => setDescription(e.target.value)} rows={3} className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white" />
            <div className="flex gap-2">
              <input type="number" placeholder="Год" value={year} onChange={e => setYear(Number(e.target.value))} className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white w-1/2" />
              <input type="number" step="0.1" min="0" max="10" placeholder="Рейтинг" value={rating} onChange={e => setRating(Number(e.target.value))} className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white w-1/2" />
            </div>
            <input placeholder="URL постера" value={posterUrl} onChange={e => setPosterUrl(e.target.value)} className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white" />
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
              <p className="text-sm mb-1">Жанры:</p>
              <div className="flex flex-wrap gap-2">
                {genresList.map(genre => (
                  <button type="button" key={genre.id} onClick={() => handleGenreToggle(genre.id)}
                    className={`px-2 py-1 rounded-full text-xs ${selectedGenres.includes(genre.id) ? 'bg-neo-pink text-white' : 'bg-white/10 text-white/70'}`}
                  >{genre.name}</button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Dialog.Close className="bg-white/10 px-4 py-2 rounded-xl">Отмена</Dialog.Close>
              <button type="submit" className="bg-neo-pink px-4 py-2 rounded-xl text-white">Добавить</button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}