'use client'

export default function VideoPlayer({ src, title, onEnded }: { src: string; title: string; onEnded?: () => void }) {
  const isDirectVideo = src && (src.endsWith('.mp4') || src.endsWith('.webm') || src.includes('storage/v1/object/public'))

  return (
    <div className="aspect-video rounded-xl overflow-hidden glass mb-6">
      {isDirectVideo ? (
        <video controls className="w-full h-full" title={title} onEnded={onEnded}>
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