import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

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
      const arrayBuffer = await foto.arrayBuffer()
      const uint8 = new Uint8Array(arrayBuffer)
      let binario = ''
      uint8.forEach(b => binario += String.fromCharCode(b))
      const base64 = btoa(binario)
      input.ip_adapter_image = `data:${foto.type};base64,${base64}`
    }

    const crear = await fetch('https://api.replicate.com/v1/predictions', {
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

    const prediccion = await crear.json()
    if (!crear.ok) throw new Error(prediccion.error || 'Error al generar')

    let estado = prediccion
    while (estado.status !== 'succeeded' && estado.status !== 'failed') {
      await new Promise(res => setTimeout(res, 2000))
      const revisar = await fetch(`https://api.replicate.com/v1/predictions/${estado.id}`, {
        headers: { 'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}` }
      })
      estado = await revisar.json()
    }

    if (estado.status === 'failed') {
      return NextResponse.json({ error: 'No se pudo generar la imagen' }, { status: 500 })
    }

    return NextResponse.json({ imagen: estado.output?.[0] || estado.output })

  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Algo salió mal al procesar' }, { status: 500 })
  }
}
