import { NextResponse } from 'next/server'

async function subirImagenABase64(archivo: File) {
  const buffer = await archivo.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')
  return `data:${archivo.type};base64,${base64}`
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const prompt = formData.get('prompt') as string
    const foto = formData.get('foto') as File | null

    if (!prompt) {
      return NextResponse.json({ error: 'Escribe tu descripción' }, { status: 400 })
    }

    const input: any = {
      prompt: prompt,
      negative_prompt: 'blurry, feo, deformado, manos mal, anatomía mala, dibujo, anime, marca de agua, texto, baja calidad',
      num_inference_steps: 30,
      guidance_scale: 7.5
    }

    if (foto) {
      input.ip_adapter_image = await subirImagenABase64(foto)
    }

    const respuesta = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: 'lucataco/realvis-xl-v4:cf1669214b850d270608093c2a068b07292125c1',
        input: input
      })
    })

    const datos = await respuesta.json()
    if (!respuesta.ok) throw new Error(datos.error || 'Error al generar')

    // Esperamos a que termine de generar
    let prediccion = datos
    while (prediccion.status !== 'succeeded' && prediccion.status !== 'failed') {
      await new Promise(resolve => setTimeout(resolve, 2000))
      const revisar = await fetch(`https://api.replicate.com/v1/predictions/${prediccion.id}`, {
        headers: { 'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}` }
      })
      prediccion = await revisar.json()
    }

    if (prediccion.status === 'failed') {
      return NextResponse.json({ error: 'No se pudo generar la imagen' }, { status: 500 })
    }

    return NextResponse.json({ imagen: prediccion.output?.[0] || prediccion.output })

  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Algo salió mal' }, { status: 500 })
  }
}
