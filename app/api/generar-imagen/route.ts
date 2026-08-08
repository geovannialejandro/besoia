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

    const output = await replicate.run(
      "lucataco/realvisxl-v4.0:2572b94bfecbc656b026776a394c86b2450410cb666fc03e913a00531cc2855f",
      {
        input: {
          prompt: `${prompt}, photorealistic, raw photo, highly detailed skin, 8k, masterpiece, cinematic lighting`,
          negative_prompt: "cartoon, illustration, animation, painting, blurry, bad anatomy, deformed",
          num_outputs: 1,
          aspect_ratio: "9:16",
          output_format: "webp"
        }
      }
    )

    const imageUrl = Array.isArray(output) ? output[0] : output

    return NextResponse.json({ url: imageUrl })

  } catch (error: any) {
    console.error("Error en Replicate:", error)
    return NextResponse.json(
      { error: error.message || 'Error interno al procesar la predicción' },
      { status: 500 }
    )
  }
}
