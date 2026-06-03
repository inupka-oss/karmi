const CACHE_NAME = 'karmi-v1'
const OFFLINE_URL = '/offline.html'

const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
]

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
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  self.clients.claim()
})

// Перехват запросов
self.addEventListener('fetch', (event) => {
  // Игнорируем не-GET запросы и API запросы
  if (event.request.method !== 'GET') return
  
  // Игнорируем API запросы к Supabase и другим сервисам
  const url = new URL(event.request.url)
  if (url.hostname.includes('supabase') || 
      url.hostname.includes('pinata') ||
      url.hostname.includes('localhost')) {
    return
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }

      return fetch(event.request).then((networkResponse) => {
        // Кэшируем успешные ответы
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })
        }
        return networkResponse
      }).catch(() => {
        // Если офлайн и запрашивают страницу - показываем offline
        if (event.request.mode === 'navigate') {
          return caches.match(OFFLINE_URL)
        }
        return new Response('Offline', { status: 503 })
      })
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
