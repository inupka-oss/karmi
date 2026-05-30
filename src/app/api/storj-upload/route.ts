import { NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const client = new S3Client({
  region: 'us-east-1',
  endpoint: process.env.STORJ_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.STORJ_ACCESS_KEY!,
    secretAccessKey: process.env.STORJ_SECRET_KEY!,
  },
  forcePathStyle: true,
})

export async function POST(request: Request) {
  const { fileName } = await request.json()
  if (!fileName) return NextResponse.json({ error: 'No file name' }, { status: 400 })

  const bucket = process.env.NEXT_PUBLIC_STORJ_BUCKET!
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: fileName,
  })

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 3600 })
  const publicUrl = `${process.env.STORJ_ENDPOINT}/${bucket}/${fileName}`

  // Добавим CORS-заголовки
  return new NextResponse(JSON.stringify({ uploadUrl, publicUrl }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}