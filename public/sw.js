const CACHE_NAME = 'karmi-v2'
const OFFLINE_URL = '/offline.html'

const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
]

// Кэш для изображений с длительным сроком хранения
const IMAGE_CACHE_NAME = 'karmi-images-v1'
const IMAGE_CACHE_MAX_SIZE = 50

// Кэш для API запросов
const API_CACHE_NAME = 'karmi-api-v1'
const API_CACHE_MAX_AGE = 5 * 60 * 1000 // 5 минут

// Установка service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

// Активация service worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(async (cacheNames) => {
      const validCaches = [CACHE_NAME, IMAGE_CACHE_NAME, API_CACHE_NAME]
      
      await Promise.all(
        cacheNames
          .filter((name) => !validCaches.includes(name))
          .map((name) => caches.delete(name))
      )
      
      // Очистка старого кэша изображений
      const imageCache = await caches.open(IMAGE_CACHE_NAME)
      const imageKeys = await imageCache.keys()
      if (imageKeys.length > IMAGE_CACHE_MAX_SIZE) {
        await Promise.all(imageKeys.slice(0, imageKeys.length - IMAGE_CACHE_MAX_SIZE).map(key => imageCache.delete(key)))
      }
    })
  )
  self.clients.claim()
})

// Перехват запросов
self.addEventListener('fetch', (event) => {
  // Игнорируем не-GET запросы
  if (event.request.method !== 'GET') return
  
  const url = new URL(event.request.url)
  
  // Игнорируем localhost и внешние сервисы
  if (url.hostname.includes('localhost') || 
      url.hostname.includes('supabase') ||
      url.hostname.includes('pinata') ||
      url.hostname.includes('cloudinary')) {
    return
  }

  // Стратегия для изображений - cache first
  if (event.request.destination === 'image') {
    event.respondWith(
      caches.open(IMAGE_CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request)
        if (cached) return cached
        
        try {
          const response = await fetch(event.request)
          if (response.ok) {
            cache.put(event.request, response.clone())
          }
          return response
        } catch {
          return cached || new Response('', { status: 404 })
        }
      })
    )
    return
  }

  // Стратегия для API - stale while revalidate
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.open(API_CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request)
        
        const fetchPromise = fetch(event.request).then((response) => {
          if (response.ok) {
            cache.put(event.request, response.clone())
          }
          return response
        })
        
        return cached || fetchPromise
      })
    )
    return
  }

  // Стратегия для страниц - network first с fallback
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })
        }
        return networkResponse
      })
      .catch(() => {
        const cached = caches.match(event.request)
        if (cached) return cached
        
        if (event.request.mode === 'navigate') {
          return caches.match(OFFLINE_URL)
        }
        return new Response('Offline', { status: 503 })
      })
  )
})

// Обработка push-уведомлений
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {}
  const title = data.title || 'Karmi'
  const options = {
    body: data.body || 'Новое уведомление',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: data.primaryKey || 1,
      url: data.url || '/',
    },
    actions: [
      {
        action: 'open',
        title: 'Открыть',
        icon: '/icon-192.png',
      },
      {
        action: 'close',
        title: 'Закрыть',
      },
    ],
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

// Обработка клика по уведомлению
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'close') {
    return
  }

  const urlToOpen = event.notification.data?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Проверяем, есть ли уже открытое окно с таким URL
      for (const client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus()
        }
      }
      // Открываем новое окно
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})
