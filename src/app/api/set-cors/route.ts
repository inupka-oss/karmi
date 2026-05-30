import { NextResponse } from 'next/server'

export async function GET() {
  const accessKey = process.env.S3_ACCESS_KEY
  const secretKey = process.env.S3_SECRET_KEY
  const endpoint = process.env.S3_ENDPOINT // https://s3.selcdn.ru
  const bucket = process.env.S3_BUCKET   // karmi-videos

  if (!accessKey || !secretKey || !endpoint || !bucket) {
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
    // Подписываем запрос вручную (Signature V4)
    const date = new Date()
    const amzDate = date.toISOString().replace(/[:-]|\.\d{3}/g, '')
    const dateStamp = amzDate.slice(0, 8)
    const region = 'ru-1'
    const service = 's3'

    // Вспомогательные функции
    async function sha256Hex(message: string): Promise<string> {
      const encoder = new TextEncoder()
      const data = encoder.encode(message)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
    }

    async function hmacHex(key: ArrayBuffer, message: string): Promise<string> {
      const encoder = new TextEncoder()
      const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
      const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message))
      return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('')
    }

    async function getSignatureKey(secretKey: string, dateStamp: string, region: string, service: string): Promise<ArrayBuffer> {
      const encoder = new TextEncoder()
      let key = await crypto.subtle.importKey('raw', encoder.encode(`AWS4${secretKey}`), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
      key = await crypto.subtle.importKey('raw', await crypto.subtle.sign('HMAC', key, encoder.encode(dateStamp)), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
      key = await crypto.subtle.importKey('raw', await crypto.subtle.sign('HMAC', key, encoder.encode(region)), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
      key = await crypto.subtle.importKey('raw', await crypto.subtle.sign('HMAC', key, encoder.encode(service)), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
      return await crypto.subtle.sign('HMAC', key, encoder.encode('aws4_request'))
    }

    // Шаг 1: канонический запрос
    const canonicalUri = `/${bucket}/`
    const canonicalQueryString = 'cors'
    const payloadHash = await sha256Hex(corsXml)
    const canonicalHeaders = `host:${new URL(endpoint).host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`
    const signedHeaders = 'host;x-amz-content-sha256;x-amz-date'
    const canonicalRequest = `PUT\n${canonicalUri}\n${canonicalQueryString}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`

    // Шаг 2: строка для подписи
    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`
    const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${await sha256Hex(canonicalRequest)}`

    // Шаг 3: подпись
    const signingKey = await getSignatureKey(secretKey, dateStamp, region, service)
    const signature = await hmacHex(signingKey, stringToSign)

    const authorizationHeader = `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

    const res = await fetch(`${endpoint}/${bucket}/?cors`, {
      method: 'PUT',
      headers: {
        'Authorization': authorizationHeader,
        'x-amz-date': amzDate,
        'x-amz-content-sha256': payloadHash,
        'Content-Type': 'application/xml',
      },
      body: corsXml,
    })

    if (res.ok) {
      return NextResponse.json({ success: true, message: 'CORS rule applied' })
    } else {
      const text = await res.text()
      return NextResponse.json({ error: 'Failed to set CORS', details: text }, { status: 500 })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}