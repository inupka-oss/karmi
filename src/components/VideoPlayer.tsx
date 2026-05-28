'use client'

export default function VideoPlayer({ src, title }: { src: string; title: string }) {
  // Если ссылка начинается с http — используем HTML5 video, иначе iframe (embed)
  const isDirectVideo = src.startsWith('http') && !src.includes('youtube.com') && !src.includes('kodik') // можно уточнить

  return (
    <div className="aspect-video rounded-xl overflow-hidden glass mb-6 card-glow">
      {isDirectVideo ? (
        <video controls className="w-full h-full" title={title}>
          <source src={src} type="video/mp4" />
          Ваш браузер не поддерживает видео.
        </video>
      ) : (
        <iframe
          src={src}
          className="w-full h-full"
          allowFullScreen
          allow="autoplay; encrypted-media"
          title={title}
        />
      )}
    </div>
  )
}