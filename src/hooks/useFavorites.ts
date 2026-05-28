'use client'
import { useState, useEffect } from 'react'

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([])

  useEffect(() => {
    const stored = localStorage.getItem('karmi-favorites')
    if (stored) {
      setFavorites(JSON.parse(stored))
    }
  }, [])

  const toggleFavorite = (animeId: string) => {
    setFavorites(prev => {
      const newFavs = prev.includes(animeId)
        ? prev.filter(id => id !== animeId)
        : [...prev, animeId]
      localStorage.setItem('karmi-favorites', JSON.stringify(newFavs))
      return newFavs
    })
  }

  const isFavorite = (animeId: string) => favorites.includes(animeId)

  return { favorites, toggleFavorite, isFavorite }
}