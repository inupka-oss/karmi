import { NextResponse } from 'next/server'

export async function GET() {
  const accessKey = process.env.S3_ACCESS_KEY
  const secretKey = process.env.S3_SECRET_KEY
  const endpoint = process.env.S3_ENDPOINT || 'https://s3.selcdn.ru'
  const bucket = process.env.S3_BUCKET || 'karmi-videos'

  if (!accessKey || !secretKey) {
    return NextResponse.json({ error: 'Missing S3 credentials' }, { status: 500 })
  }

  const corsXml = `<CORSConfiguration>
    <CORSRule>
        <AllowedOrigin>*</AllowedOrigin>
        <AllowedMethod>GET</AllowedMethod>
        <AllowedMethod>PUT</AllowedMethod>
        <AllowedMethod>HEAD</AllowedMethod>
        <AllowedMethod>OPTIONS</AllowedMethod>
        <AllowedHeader>*</AllowedHeader>
    </CORSRule>
</CORSConfiguration>`

  try {
    // Используем Signature V4 с AWS SDK – это гарантирует правильную подпись
    const { S3Client, PutBucketCorsCommand } = await import('@aws-sdk/client-s3')
    
    const client = new S3Client({
      region: 'ru-1',
      endpoint: endpoint,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
      forcePathStyle: true,
    })

    await client.send(new PutBucketCorsCommand({
      Bucket: bucket,
      CORSConfiguration: {
        CORSRules: [{
          AllowedOrigins: ['*'],
          AllowedMethods: ['GET', 'PUT', 'HEAD', 'OPTIONS'],
          AllowedHeaders: ['*'],
          ExposeHeaders: [],
          MaxAgeSeconds: 0
        }]
      }
    }))

    return NextResponse.json({ success: true, message: 'CORS rule applied via SDK' })
  } catch (error: any) {
    console.error('CORS error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}