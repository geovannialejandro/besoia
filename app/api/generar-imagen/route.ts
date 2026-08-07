import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const input = await req.json()

    if (!input.prompt) {
      return NextResponse.json(
        { error: 'El prompt es obligatorio' },
        { status: 400 }
      )
    }

    // Validar imagen si existe
    if (input.image && typeof input.image !== 'string') {
      return NextResponse.json(
        { error: 'La imagen debe ser una URL válida' },
        { status: 400 }
      )
    }

    const crear = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: 'stability-ai/sdxl',
        input: {
          prompt: `ultra realistic photo, ${input.prompt}, natural lighting, skin texture, 35mm lens`,
          ...(input.image && { image: input.image }),
          strength: 0.6,
          guidance_scale: 7.5,
          num_inference_steps: 30
        }
      })
    })

    const prediccion = await crear.json()

    if (!crear.ok) {
      throw new Error(prediccion.error || 'Error al crear predicción')
    }

    let estado = prediccion
    let intentos = 0

    while (
      estado.status !== 'succeeded' &&
      estado.status !== 'failed' &&
      intentos < 40
    ) {
      await new Promise(res => setTimeout(res, 2000))

      const revisar = await fetch(
        `https://api.replicate.com/v1/predictions/${estado.id}`,
        {
          headers: {
            'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`
          }
        }
      )

      estado = await revisar.json()
      intentos++
    }

    if (estado.status === 'failed') {
      return NextResponse.json(
        { error: 'Falló la generación', detalle: estado.error },
        { status: 500 }
      )
    }

    const urlImagen = Array.isArray(estado.output)
      ? estado.output[0]
      : estado.output

    return NextResponse.json({ imagen: urlImagen })

  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    )
  }
}
