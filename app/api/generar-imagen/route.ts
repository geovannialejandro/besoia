import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { prompt, image } = await req.json()

    if (!prompt) {
      return NextResponse.json({ error: 'Escribe tu descripción' }, { status: 400 })
    }

    if (!image) {
      return NextResponse.json({ error: 'Sube una imagen de referencia' }, { status: 400 })
    }

    // ========== Subir imagen a Cloudinary (sin librería) ==========
    const formData = new FormData()
    formData.append('file', image)
    formData.append('upload_preset', 'ml_default') // ← si tienes un preset unsigned, ponlo aquí. Si no, usamos firmado abajo

    // Versión firmada (más segura)
    const timestamp = Math.round(new Date().getTime() / 1000)
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    // Generar firma simple
    const signatureString = `timestamp=\( {timestamp} \){apiSecret}`
    const encoder = new TextEncoder()
    const data = encoder.encode(signatureString)
    const hashBuffer = await crypto.subtle.digest('SHA-1', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    const cloudinaryRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: JSON.stringify({
          file: image,
          api_key: apiKey,
          timestamp: timestamp,
          signature: signature,
          folder: 'besoia-references'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )

    const cloudinaryData = await cloudinaryRes.json()

    if (!cloudinaryData.secure_url) {
      console.error(cloudinaryData)
      return NextResponse.json({ error: 'Error subiendo imagen a Cloudinary' }, { status: 500 })
    }

    const imageUrl = cloudinaryData.secure_url

    // ========== Llamar a Replicate ==========
    const createRes = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        version: 'zsxkib/instant-id:2e4785a4d80dadf580077b2244c8d7c05d8e3faac04a04c02d8e099dd2876789',
        input: {
          image: imageUrl,
          prompt: prompt,
          negative_prompt: 'blurry, low quality, deformed, ugly, bad anatomy, extra limbs, watermark, text, cartoon, anime, drawing, plastic skin',
          width: 832,
          height: 1216,
          num_inference_steps: 30,
          guidance_scale: 5,
          ip_adapter_scale: 0.8,
          controlnet_conditioning_scale: 0.8,
          disable_safety_checker: true
        },
      }),
    })

    let result = await createRes.json()

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // Polling
    for (let i = 0; i < 180; i++) {
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
