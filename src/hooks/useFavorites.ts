'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'

const STORAGE_KEY = 'karmi-favorites'

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setFavorites(JSON.parse(stored))
      } catch {
        setFavorites([])
      }
    }
    setIsLoaded(true)
  }, [])

  const addFavorite = useCallback((animeId: string) => {
    setFavorites((prev) => {
      if (prev.includes(animeId)) return prev
      const updated = [...prev, animeId]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  const removeFavorite = useCallback((animeId: string) => {
    setFavorites((prev) => {
      const updated = prev.filter((id) => id !== animeId)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  const toggleFavorite = useCallback(
    (animeId: string) => {
      setFavorites((prev) => {
        const exists = prev.includes(animeId)
        const updated = exists ? prev.filter((id) => id !== animeId) : [...prev, animeId]
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
        return updated
      })
    },
    []
  )

  const isFavorite = useMemo(
    () => (animeId: string) => favorites.includes(animeId),
    [favorites]
  )

  return { favorites, addFavorite, removeFavorite, toggleFavorite, isFavorite, isLoaded }
}
