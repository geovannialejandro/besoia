import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { prompt, fotoReferencia } = await req.json()
    const res = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: 'lucataco/realvis-xl-v4:cf1669214b850d270608093c2a068b07292125c1',
        input: {
          prompt: prompt,
          ip_adapter_image: fotoReferencia || '',
          num_inference_steps: 30,
          guidance_scale: 7.5
        }
      })
    })
    const data = await res.json()
    return NextResponse.json({ imagen: data.output?.[0] || data.output })
  } catch (e) {
    return NextResponse.json({ error: 'No se pudo generar', status: 500 })
  }
}

