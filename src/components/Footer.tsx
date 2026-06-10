import Link from 'next/link'
import { HeartIcon } from './Icons'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-20 border-t border-white/5">
      {/* Основной контент футера */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Бренд */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-block">
              <h2 className="text-2xl font-bold text-glow-white">
                Kar<span className="text-neo-pink">mi</span>
              </h2>
            </Link>
            <p className="text-gray-500 text-sm mt-3 leading-relaxed max-w-xs">
              Бесплатный сайт для просмотра аниме в хорошем качестве. Огромная библиотека, удобный интерфейс.
            </p>
          </div>

          {/* Навигация */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
              Навигация
            </h3>
            <nav className="flex flex-col gap-2.5">
              <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors duration-200">
                Главная
              </Link>
              <Link href="/catalog" className="text-gray-400 hover:text-white text-sm transition-colors duration-200">
                Каталог
              </Link>
              <Link href="/ongoing" className="text-gray-400 hover:text-white text-sm transition-colors duration-200">
                Онгоинги
              </Link>
              <Link href="/top" className="text-gray-400 hover:text-white text-sm transition-colors duration-200">
                Топ-100
              </Link>
              <Link href="/schedule" className="text-gray-400 hover:text-white text-sm transition-colors duration-200">
                Расписание
              </Link>
            </nav>
          </div>

          {/* Аккаунт */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
              Аккаунт
            </h3>
            <nav className="flex flex-col gap-2.5">
              <Link href="/login" className="text-gray-400 hover:text-white text-sm transition-colors duration-200">
                Войти
              </Link>
              <Link href="/signup" className="text-gray-400 hover:text-white text-sm transition-colors duration-200">
                Регистрация
              </Link>
              <Link href="/profile" className="text-gray-400 hover:text-white text-sm transition-colors duration-200">
                Профиль
              </Link>
              <Link href="/favorites" className="text-gray-400 hover:text-white text-sm transition-colors duration-200">
                Избранное
              </Link>
            </nav>
          </div>

          {/* Соцсети */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
              Сообщество
            </h3>
            <nav className="flex flex-col gap-2.5">
              <a
                href="https://t.me/KarmiStudio"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-neo-purple-light text-sm transition-colors duration-200 inline-flex items-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
                Telegram
              </a>
            </nav>
          </div>
        </div>
      </div>

      {/* Нижняя полоса */}
      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-gray-600 text-xs">
            © {currentYear} Karmi. Все права защищены.
          </span>
          <span className="text-gray-600 text-xs inline-flex items-center gap-1">
            Сделано с <HeartIcon className="w-3 h-3 text-neo-pink" filled={true} /> для любителей аниме
          </span>
        </div>
      </div>
    </footer>
  )
}