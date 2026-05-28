import { NextResponse } from 'next/server'
import cloudinary from 'cloudinary'

// Настройка Cloudinary с секретным ключом (только на сервере)
cloudinary.v2.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get('file') as File

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  // Преобразуем File в Buffer
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  try {
    // Загружаем в Cloudinary (в папку karmi-videos)
    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.v2.uploader.upload_stream(
        {
          resource_type: 'video',
          folder: 'karmi-videos',
          use_filename: true,
          unique_filename: true,
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result!)
        }
      ).end(buffer)
    })

    return NextResponse.json({ url: result.secure_url })
  } catch (error) {
    console.error('Cloudinary upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}