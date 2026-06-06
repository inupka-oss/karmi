import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="mt-20 py-10 glass border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col items-center gap-6 text-sm text-gray-400">
          {/* Логотип */}
          <Link href="/" className="text-2xl font-bold text-glow-white hover:text-neo-pink transition-colors">
            Kar<span className="text-neo-pink">mi</span>
          </Link>
          
          {/* Навигация */}
          <nav className="flex flex-wrap justify-center gap-6" aria-label="Навигация в футере">
            <Link href="/" className="hover:text-white transition-colors duration-200">Главная</Link>
            <Link href="/catalog" className="hover:text-white transition-colors duration-200">Каталог</Link>
            <Link href="/ongoing" className="hover:text-white transition-colors duration-200">Онгоинги</Link>
            <Link href="/top" className="hover:text-white transition-colors duration-200">Топ-100</Link>
            <Link href="/schedule" className="hover:text-white transition-colors duration-200">Расписание</Link>
          </nav>
          
          {/* Разделитель */}
          <div className="w-full h-px bg-white/10" />
          
          {/* Копирайт и соцсети */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <span className="text-gray-500">© 2025 Karmi. Все права защищены.</span>
          <a
            href="https://t.me/KarmiStudio"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-neo-purple-light hover:text-neo-purple transition-colors font-medium"
          >
            <span>📢</span> Telegram-канал
          </a>
          </div>
        </div>
      </div>
    </footer>
  )
}