import { NextResponse } from 'next/server'
import Replicate from 'replicate'

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
})

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()

    if (!prompt) {
      return NextResponse.json({ error: 'Falta el prompt' }, { status: 400 })
    }

    // Usamos el modelo estable por nombre de usuario y modelo
    const output = await replicate.run(
      "lucataco/realvisxl-v4.0",
      {
        input: {
          prompt: `${prompt}, photorealistic, raw photo, highly detailed skin, 8k, masterpiece`,
          negative_prompt: "cartoon, illustration, animation, painting, blurry",
          num_outputs: 1,
          aspect_ratio: "9:16"
        }
      }
    )

    const imageUrl = Array.isArray(output) ? output[0] : output

    return NextResponse.json({ url: imageUrl })

  } catch (error: any) {
    console.error("Error detallado de Replicate:", error)
    return NextResponse.json(
      { error: error.message || 'Error interno al procesar' },
      { status: 500 }
    )
  }
}
