import type { Metadata } from 'next'
import { Rubik } from 'next/font/google'
import { Suspense } from 'react'
import './globals.css'
import Header from '@/components/Header'
import ScrollToTopButton from '@/components/ScrollToTopButton'
import ProgressBar from './ProgressBar'
import Footer from '@/components/Footer'

const rubik = Rubik({ subsets: ['cyrillic', 'latin'], variable: '--font-rubik' })

export const metadata: Metadata = {
  title: 'Karmi — смотреть аниме онлайн',
  description: 'Karmi — бесплатный сайт для просмотра аниме в стиле нео-брутализма',
  icons: {
    icon: '/favicon.svg',
  },
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
        <ScrollToTopButton />
      </body>
    </html>
  )
}