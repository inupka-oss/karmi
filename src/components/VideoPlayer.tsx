'use client'

export default function VideoPlayer({ src, title }: { src: string; title: string }) {
  return (
    <div className="aspect-video rounded-xl overflow-hidden glass mb-6">
      <iframe
        src={src}
        className="w-full h-full"
        allowFullScreen
        allow="autoplay; encrypted-media"
        title={title}
      />
    </div>
  )
}