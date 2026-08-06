import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: Request) {
  try {
    // Verificamos que exista el token
    if (!process.env.REPLICATE_API_TOKEN) {
      throw new Error('Falta configurar el token de Replicate')
    }

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

    // ✅ Forma correcta para Node.js/Vercel
    if (foto) {
      const arrayBuffer = await foto.arrayBuffer()
      const uint8 = new Uint8Array(arrayBuffer)
      const base64 = Buffer.from(uint8).toString('base64')
      input.ip_adapter_image = `data:${foto.type};base64,${base64}`
    }

    // Log para ver qué enviamos
    console.log('Enviando a Replicate:', input)

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
    console.log('Respuesta inicial:', prediccion)

    if (!crear.ok) throw new Error(prediccion.error || 'Error al generar')

    let estado = prediccion
    while (estado.status !== 'succeeded' && estado.status !== 'failed') {
      await new Promise(res => setTimeout(res, 2000))
      const revisar = await fetch(`https://api.replicate.com/v1/predictions/${estado.id}`, {
        headers: { 'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}` }
      })
      estado = await revisar.json()
      console.log('Estado actual:', estado.status)
    }

    if (estado.status === 'failed') {
      return NextResponse.json({ error: estado.error || 'No se pudo generar la imagen' }, { status: 500 })
    }

    return NextResponse.json({ imagen: estado.output?.[0] || estado.output })

  } catch (err) {
    console.error('Error completo:', err)
    return NextResponse.json({ error: (err as Error).message || 'Algo salió mal al procesar' }, { status: 500 })
  }
}

