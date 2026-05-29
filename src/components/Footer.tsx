import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="mt-20 py-8 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
        <div className="flex items-center gap-4">
          <Link href="/" className="hover:text-white transition">Главная</Link>
          <Link href="/catalog" className="hover:text-white transition">Каталог</Link>
          <Link href="/ongoing" className="hover:text-white transition">Онгоинги</Link>
        </div>
        <div className="flex items-center gap-2">
          <span>© 2025 Karmi. Все права защищены.</span>
          <a
            href="https://t.me/KarmiStudio"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neo-pink hover:text-neo-pink/80 transition font-semibold"
          >
            Telegram-канал
          </a>
        </div>
      </div>
    </footer>
  )
}