import { NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const client = new S3Client({
  region: 'ru-1', // для Selectel
  endpoint: process.env.S3_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
  forcePathStyle: true,
})

export async function POST(request: Request) {
  const { fileName } = await request.json()
  if (!fileName) {
    return NextResponse.json({ error: 'No file name' }, { status: 400 })
  }

  const bucket = process.env.S3_BUCKET!
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: fileName,
  })

  try {
    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 3600 })
    const publicUrl = `${process.env.NEXT_PUBLIC_DOWNLOAD_URL}/${fileName}`
    return NextResponse.json({ uploadUrl, publicUrl })
  } catch (error: any) {
    console.error('S3 presigned error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}