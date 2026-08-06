import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { foto, ropa } = await req.json()
    const res = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: 'yuukicammy/idm-vton:98372b8b7c6d5e4f3a2b1c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0',
        input: {
          human_img: foto,
          garment: ropa,
          garment_des: ropa,
          num_inference_steps: 30,
          guidance_scale: 7
        }
      })
    })
    const data = await res.json()
    return NextResponse.json({ imagen: data.output?.[0] || data.output })
  } catch (e) {
    return NextResponse.json({ error: 'No se pudo cambiar la ropa', status: 500 })
  }
}
