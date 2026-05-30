import { NextResponse } from 'next/server'
import { S3Client, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, AbortMultipartUploadCommand } from '@aws-sdk/client-s3'

const client = new S3Client({
  region: 'ru-1',
  endpoint: process.env.S3_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
  forcePathStyle: true,
})

export async function POST(request: Request) {
  const { fileName } = await request.json()
  if (!fileName) return NextResponse.json({ error: 'No file name' }, { status: 400 })

  const bucket = process.env.S3_BUCKET!
  try {
    // Создаём многокомпонентную загрузку (TUS-совместимый)
    const upload = await client.send(new CreateMultipartUploadCommand({
      Bucket: bucket,
      Key: fileName,
    }))

    return NextResponse.json({
      uploadId: upload.UploadId,
      bucket,
      key: fileName,
      endpoint: process.env.S3_ENDPOINT,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}