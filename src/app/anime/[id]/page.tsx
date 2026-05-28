export default async function AnimePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params   // просто чтобы показать, что мы обработали Promise
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 text-white">
      <h1 className="text-3xl font-bold">Тест маршрута</h1>
      <p>ID аниме: {id}</p>
    </div>
  )
}