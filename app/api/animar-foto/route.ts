import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { foto } = await req.json()
    const res = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: 'kwairsc/liveportrait:85d97f3a2b1c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e',
        input: {
          source_image: foto,
          driving_pose: 'neutral'
        }
      })
    })
    const data = await res.json()
    return NextResponse.json({ video: data.output?.[0] || data.output })
  } catch (e) {
    return NextResponse.json({ error: 'No se pudo animar', status: 500 })
  }
}

