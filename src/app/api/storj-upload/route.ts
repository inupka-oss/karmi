import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { fileName } = await request.json()
  if (!fileName) {
    return NextResponse.json({ error: 'No file name' }, { status: 400 })
  }

  const accessKey = process.env.STORJ_ACCESS_KEY
  const secretKey = process.env.STORJ_SECRET_KEY
  const endpoint = process.env.STORJ_ENDPOINT
  const bucket = process.env.NEXT_PUBLIC_STORJ_BUCKET

  // Возвращаем маскированные значения, чтобы проверить, что они пришли
  return NextResponse.json({
    hasAccessKey: !!accessKey,
    accessKeyPreview: accessKey ? accessKey.substring(0, 5) + '...' : null,
    hasSecretKey: !!secretKey,
    secretKeyPreview: secretKey ? secretKey.substring(0, 5) + '...' : null,
    endpoint: endpoint,
    bucket: bucket,
  })
}