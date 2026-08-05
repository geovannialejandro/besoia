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
        version: 'lucataco/juggernaut-xl-v9:bea09cf018e513cef0841719559ea86d2299e05448633ac8fe270b5d5cd6777e',
        input: {
          prompt: `RAW photo, ${prompt}, photorealistic, natural skin texture, soft lighting, realistic imperfections`,
          negative_prompt: 'anime, cartoon, illustration, painting, drawing, cgi, 3d render, fake skin, plastic, blurry, bad anatomy',

          width: 768,
          height: 1024,

          num_inference_steps: 30,
          guidance_scale: 6,

          // 👇 algunos wrappers sí aceptan esto
          scheduler: "K_EULER"
        },
      }),
    })

    let result = await createRes.json()

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // ⏳ polling
    for (let i = 0; i < 180; i++) {
      if (result.status === 'succeeded') break

      if (result.status === 'failed' || result.status === 'canceled') {
        return NextResponse.json(
          { error: result.error || 'La generación falló' },
          { status: 500 }
        )
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
    return NextResponse.json(
      { error: error.message || 'Error generando imagen' },
      { status: 500 }
    )
  }
}
