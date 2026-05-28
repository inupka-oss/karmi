export default function AnimePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 text-white">
      <h1 className="text-3xl font-bold mb-4">Диагностика переменных окружения</h1>
      <p><strong>SUPABASE_URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL || 'НЕ НАЙДЕН'}</p>
      <p><strong>SUPABASE_ANON_KEY:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 15) || 'НЕ НАЙДЕН'}...</p>
    </div>
  )
}