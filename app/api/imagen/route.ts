import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { prompt, negativePrompt = "" } = await req.json()

    if (!prompt) {
      return NextResponse.json({ error: 'Escribe tu descripción' }, { status: 400 })
    }

    // 1. Crear la predicción
    const createRes = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: 'bea09cf018e513cef0841719559ea86d2299e05448633ac8fe270b5d5cd6777e',
        input: {
          prompt,
          negative_prompt: negativePrompt,
          disable_safety_checker: true,
          width: 832,
          height: 1216,
          num_inference_steps: 25,
          guidance_scale: 5.5,
        },
      }),
    })

    const prediction = await createRes.json()

    if (prediction.error) {
      return NextResponse.json({ error: prediction.error }, { status: 400 })
    }

    // 2. Hacer polling hasta que termine
    let result = prediction
    const maxAttempts = 60 // máximo \~60 segundos

    for (let i = 0; i < maxAttempts; i++) {
      if (result.status === 'succeeded') break
      if (result.status === 'failed' || result.status === 'canceled') {
        return NextResponse.json({ error: result.error || 'La generación falló' }, { status: 500 })
      }

      await new Promise((r) => setTimeout(r, 1000)) // esperar 1 segundo

      const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
        headers: {
          'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        },
      })
      result = await pollRes.json()
    }

    if (result.status !== 'succeeded') {
      return NextResponse.json({ error: 'Tiempo de espera agotado' }, { status: 504 })
    }

    const imageUrl = Array.isArray(result.output) ? result.output[0] : result.output

    // 3. Devolver en el formato que espera el frontend
    return NextResponse.json({ image: imageUrl })

  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ error: error.message || 'No se pudo generar la imagen' }, { status: 500 })
  }
}

