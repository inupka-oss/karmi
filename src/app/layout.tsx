import type { Metadata } from 'next'
import { Rubik } from 'next/font/google'
import './globals.css'

const rubik = Rubik({ subsets: ['cyrillic', 'latin'], variable: '--font-rubik' })

export const metadata: Metadata = {
  title: 'Карми — смотреть аниме онлайн',
  description: 'Карми — бесплатный сайт для просмотра аниме в стиле нео-брутализма',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className={`${rubik.variable} font-sans bg-neo-dark text-white`}>
        {children}
      </body>
    </html>
  )
}