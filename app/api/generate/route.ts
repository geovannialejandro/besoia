
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()

    if (!prompt) {
      return NextResponse.json({ error: 'Escribe tu descripción' }, { status: 400 })
    }

    const createRes = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        // 🔥 CAMBIO DE MODELO (hash fijo para evitar errores)
        version: 'asiryan/realvisxl-v4:3f9f3f8c1a9b4e5d7c6a2c5f0b1e8a6b5c2d9f4a1b6c3d8e9f0a1b2c3d4e5f6',

        input: {
          // 🔥 prompt mejorado automáticamente
          prompt: `RAW photo, ${prompt}, natural skin texture, realistic imperfections, photorealistic, soft lighting`,

          // 🔥 negativa limpia (sin matar detalles)
          negative_prompt: 'anime, cartoon, illustration, painting, drawing, cgi',

          // 🔥 mejor formato (más usable para retratos)
          width: 832,
          height: 1216,

          num_inference_steps: 30,
          guidance_scale: 6,
        },
      }),
    })

    let result = await createRes.json()

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // Esperamos hasta que esté lista
    for (let i = 0; i < 90; i++) {
      if (result.status === 'succeeded') break
      if (result.status === 'failed' || result.status === 'canceled') {
        return NextResponse.json({ error: result.error || 'La generación falló' }, { status: 500 })
      }

      await new Promise((r) => setTimeout(r, 1000))

      const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
        headers: {
          'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
          'Accept': 'application/json'
        },
      })
      result = await pollRes.json()
    }

    if (result.status !== 'succeeded') {
      return NextResponse.json({ error: 'Tiempo de espera agotado' }, { status: 504 })
    }

    const imageUrl = Array.isArray(result.output) ? result.output[0] : result.output

    if (!imageUrl) {
      return NextResponse.json({ error: 'No se obtuvo la imagen' }, { status: 500 })
    }

    return NextResponse.json({ image: imageUrl })

  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ error: error.message || 'Error generando imagen' }, { status: 500 })
  }
}
