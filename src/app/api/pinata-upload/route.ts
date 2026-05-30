import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get('file') as File

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const pinataApiKey = process.env.PINATA_API_KEY
  const pinataApiSecret = process.env.PINATA_API_SECRET

  if (!pinataApiKey || !pinataApiSecret) {
    return NextResponse.json({ error: 'Missing Pinata credentials' }, { status: 500 })
  }

  try {
    const pinataFormData = new FormData()
    pinataFormData.append('file', file)

    const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'pinata_api_key': pinataApiKey,
        'pinata_secret_api_key': pinataApiSecret,
      },
      body: pinataFormData,
    })

    if (!res.ok) {
      const error = await res.json()
      return NextResponse.json({ error: error.error?.message || 'Pinata upload failed' }, { status: res.status })
    }

    const data = await res.json()
    const ipfsHash = data.IpfsHash
    const publicUrl = `${process.env.NEXT_PUBLIC_IPFS_GATEWAY}/${ipfsHash}`

    return NextResponse.json({ publicUrl })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}