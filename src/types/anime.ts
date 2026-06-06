/**
 * Типы для системы аниме
 */

export interface Genre {
  id: string
  name: string
  slug: string
}

export interface Anime {
  id: string
  title_ru: string
  title_en?: string
  title_jp?: string
  description?: string
  poster_url: string
  cover_url?: string
  trailer_url?: string
  type: 'tv' | 'movie' | 'ova' | 'ona' | 'special' | 'music'
  status: 'ongoing' | 'completed' | 'announced' | 'hiatus'
  year?: number
  rating?: number
  episodes?: number
  duration?: number
  genres?: Genre[]
  created_at: string
  updated_at: string
}

export interface Episode {
  id: string
  anime_id: string
  episode_number: number
  title?: string
  description?: string
  video_url: string
  thumbnail_url?: string
  duration?: number
  opening_start?: number
  opening_end?: number
  ending_start?: number
  ending_end?: number
  created_at: string
  anime?: Anime
}

export interface AnimeWithDetails extends Omit<Anime, 'episodes'> {
  episodes?: Episode[]
  related_anime?: Anime[]
}
