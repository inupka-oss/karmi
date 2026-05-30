import { NextResponse } from 'next/server'

export async function GET() {
  const apiKey = process.env.PINATA_API_KEY
  const apiSecret = process.env.PINATA_API_SECRET

  if (!apiKey || !apiSecret) {
    return NextResponse.json({ error: 'Pinata keys missing' }, { status: 500 })
  }

  try {
    // Генерируем временный JWT-токен для прямой загрузки
    const res = await fetch('https://api.pinata.cloud/v3/pinning/generateApiKey', {
      method: 'POST',
      headers: {
        'pinata_api_key': apiKey,
        'pinata_secret_api_key': apiSecret,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        keyName: `upload-${Date.now()}`,
        maxUses: 1,
        permissions: {
          endpoints: {
            pinning: {
              pinFileToIPFS: true,
            },
          },
        },
      }),
    })

    if (!res.ok) {
      const error = await res.json()
      return NextResponse.json({ error: error.error?.message || 'Failed to generate token' }, { status: 500 })
    }

    const data = await res.json()
    return NextResponse.json({ jwt: data.JWT })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}