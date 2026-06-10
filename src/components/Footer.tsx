import Link from 'next/link'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-24 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-block">
              <h2 className="text-xl font-bold">
                <span className="text-white">Kar</span>
                <span className="bg-gradient-to-r from-neo-purple to-neo-pink bg-clip-text text-transparent">mi</span>
              </h2>
            </Link>
            <p className="text-white/25 text-sm mt-3 leading-relaxed max-w-xs">
              Бесплатный сайт для просмотра аниме в хорошем качестве
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-4">Навигация</h3>
            <nav className="flex flex-col gap-2.5">
              {[
                ['/', 'Главная'], ['/catalog', 'Каталог'], ['/ongoing', 'Онгоинги'],
                ['/top', 'Топ-100'], ['/schedule', 'Расписание'],
              ].map(([href, label]) => (
                <Link key={href} href={href} className="text-white/30 hover:text-white/70 text-sm transition-colors">{label}</Link>
              ))}
            </nav>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-4">Аккаунт</h3>
            <nav className="flex flex-col gap-2.5">
              {[
                ['/login', 'Войти'], ['/signup', 'Регистрация'],
                ['/profile', 'Профиль'], ['/favorites', 'Избранное'],
              ].map(([href, label]) => (
                <Link key={href} href={href} className="text-white/30 hover:text-white/70 text-sm transition-colors">{label}</Link>
              ))}
            </nav>
          </div>

          {/* Community */}
          <div>
            <h3 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-4">Сообщество</h3>
            <nav className="flex flex-col gap-2.5">
              <a href="https://t.me/KarmiStudio" target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-neo-purple-light text-sm transition-colors inline-flex items-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                Telegram
              </a>
            </nav>
          </div>
        </div>
      </div>

      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-white/15 text-xs">© {year} Karmi</span>
          <span className="text-white/15 text-xs">Сделано с <span className="text-neo-pink">♥</span> для любителей аниме</span>
        </div>
      </div>
    </footer>
  )
}