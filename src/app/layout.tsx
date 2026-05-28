import type { Metadata } from 'next'
import { Rubik } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'

const rubik = Rubik({ subsets: ['cyrillic', 'latin'], variable: '--font-rubik' })

export const metadata: Metadata = {
  title: 'Карми — смотреть аниме онлайн',
  
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
        <Header />
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  )
}