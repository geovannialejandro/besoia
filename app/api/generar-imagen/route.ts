import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { prompt, image } = await req.json()

    if (!prompt) {
      return NextResponse.json({ error: 'Escribe tu descripción' }, { status: 400 })
    }

    // ========== Subir imagen a Cloudinary (si mandaron imagen) ==========
    let imageUrl = null

    if (image) {
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME

      const formData = new FormData()
      formData.append('file', image)
      formData.append('upload_preset', 'besoia_upload')
      formData.append('folder', 'besoia-references')

      const cloudinaryRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      )

      const cloudinaryData = await cloudinaryRes.json()

      if (cloudinaryData.secure_url) {
        imageUrl = cloudinaryData.secure_url
      }
    }

    // ========== Llamar a Replicate - RealVisXL (uncensored) ==========
    const createRes = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        version: 'adirik/realvisxl-v4.0:85a58cc71587cc27539b7c83eb1ce4aea02feedfb9a9fae0598cebc110a3d695',
        input: {
          prompt: prompt,
          negative_prompt: 'blurry, low quality, deformed, ugly, bad anatomy, extra limbs, watermark, text, cartoon, anime, drawing, illustration, 3d, render, plastic skin',
          image: imageUrl,                    // referencia (opcional)
          prompt_strength: imageUrl ? 0.75 : 1, // qué tanto respeta la imagen de referencia
          width: 832,
          height: 1216,
          num_inference_steps: 30,
          guidance_scale: 5.5,
          scheduler: 'DPM++_SDE_Karras',
          disable_safety_checker: true,
          apply_watermark: false
        },
      }),
    })

    let result = await createRes.json()

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // Polling
    for (let i = 0; i < 120; i++) {
      if (result.status === 'succeeded') break
      if (result.status === 'failed' || result.status === 'canceled') {
        return NextResponse.json({ error: result.error || 'La generación falló' }, { status: 500 })
      }

      await new Promise(r => setTimeout(r, 1000))

      const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
        headers: {
          'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
          'Accept': 'application/json'
        }
      })
      result = await pollRes.json()
    }

    if (result.status !== 'succeeded') {
      return NextResponse.json({ error: 'Tiempo de espera agotado' }, { status: 504 })
    }

    const finalImage = Array.isArray(result.output) ? result.output[0] : result.output

    if (!finalImage) {
      return NextResponse.json({ error: 'No se obtuvo la imagen' }, { status: 500 })
    }

    return NextResponse.json({ image: finalImage })

  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ error: error.message || 'Error generando imagen' }, { status: 500 })
  }
}
