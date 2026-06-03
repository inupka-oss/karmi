import type { Metadata } from 'next'
import { Rubik } from 'next/font/google'
import { Suspense } from 'react'
import './globals.css'
import Header from '@/components/Header'
import ScrollToTopButton from '@/components/ScrollToTopButton'
import ProgressBar from './ProgressBar'
import Footer from '@/components/Footer'
import BottomNav from '@/components/BottomNav'

const rubik = Rubik({ subsets: ['cyrillic', 'latin'], variable: '--font-rubik' })

export const metadata: Metadata = {
  title: 'Karmi — смотреть аниме онлайн',
  description: 'Karmi — бесплатный сайт для просмотра аниме в хорошем качестве',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.svg',
    apple: '/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Karmi',
  },
  themeColor: '#ff6b9d',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru" className="dark">
      <body className={`${rubik.variable} font-sans bg-neo-dark text-white`}>
        <Suspense fallback={null}>
          <ProgressBar />
        </Suspense>
        <Header />
        <main className="relative z-10 animate-fade-in min-h-screen">
          {children}
        </main>
        <Footer />
        <BottomNav />
        <ScrollToTopButton />
        <PWAInstall />
      </body>
    </html>
  )
}

// Компонент регистрации service worker и инициализации Supabase
function PWAInstall() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          // Инициализация Supabase клиента для глобального доступа
          const supabaseUrl = '${process.env.NEXT_PUBLIC_SUPABASE_URL}'
          const supabaseKey = '${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}'
          
          // Загружаем Supabase JS клиент
          if (!window.supabase) {
            window.supabaseUrl = supabaseUrl
            window.supabaseKey = supabaseKey
            console.log('✅ Supabase инициализирован:', { url: supabaseUrl })
          }
          
          // Service Worker
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js')
                .then((registration) => {
                  console.log('SW registered:', registration.scope)
                })
                .catch((error) => {
                  console.log('SW registration failed:', error)
                })
            })
          }
          
          // Запрос на установку PWA
          let deferredPrompt
          window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault()
            deferredPrompt = e
            console.log('PWA install prompt available')
          })
        `,
      }}
    />
  )
}