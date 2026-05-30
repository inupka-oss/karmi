import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { fileName } = await request.json()
    if (!fileName) {
      return NextResponse.json({ error: 'No file name' }, { status: 400 })
    }

    // Проверяем, что переменные окружения доступны
    const accessKey = process.env.STORJ_ACCESS_KEY
    const secretKey = process.env.STORJ_SECRET_KEY
    const endpoint = process.env.STORJ_ENDPOINT
    const bucket = process.env.NEXT_PUBLIC_STORJ_BUCKET

    if (!accessKey || !secretKey || !endpoint || !bucket) {
      return NextResponse.json(
        { error: 'Missing Storj environment variables. Check Vercel settings.' },
        { status: 500 }
      )
    }

    // Если все ключи есть, но мы не можем использовать AWS SDK, временно пропустим
    // и вернём заглушку, чтобы проверить связь
    return NextResponse.json({
      uploadUrl: `${endpoint}/${bucket}/${fileName}`,
      publicUrl: `${endpoint}/${bucket}/${fileName}`,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}