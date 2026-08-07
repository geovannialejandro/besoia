import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const cuerpoCrudo = await req.text()
    console.log('📥 Recibido:', cuerpoCrudo)

    let input
    try {
      input = JSON.parse(cuerpoCrudo)
    } catch {
      return NextResponse.json({ error: 'Formato incorrecto' }, { status: 400 })
    }

    if (input.ip_adapter_image) {
      if (typeof input.ip_adapter_image !== 'string' || !input.ip_adapter_image.startsWith('http')) {
        return NextResponse.json({ error: 'La imagen no se subió bien', status: 400 })
      }
    }

    const crear = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: 'lucataco/cyberrealistic-xl-v3:95a012c7732289547979b486c1c27d2d0c28f3a05f3f3a8d7f9c0b5a7d9e8f0a',
        input: {
          prompt: input.prompt,
          negative_prompt: 'cara distinta, rasgos cambiados, feo, deformado, manos mal hechas, borroso, baja calidad, dibujo, caricatura',
          num_inference_steps: 35,
          guidance_scale: 7,
          disable_safety_checker: true,
          ip_adapter_image: input.ip_adapter_image,
          ip_adapter_scale: 0.85
        }
      })
    })

    const textoRespuesta = await crear.text()
    console.log('📤 Replicate dice:', textoRespuesta)

    let prediccion
    try {
      prediccion = JSON.parse(textoRespuesta)
    } catch {
      return NextResponse.json({ error: 'Error de Replicate', detalle: textoRespuesta }, { status: 500 })
    }

    if (!crear.ok) {
      return NextResponse.json({ error: prediccion.error || 'Error', detalle: prediccion }, { status: crear.status })
    }

    let estado = prediccion
    let intentos = 0
    while (estado.status !== 'succeeded' && estado.status !== 'failed' && intentos < 60) {
      await new Promise(res => setTimeout(res, 2500))
      const revisar = await fetch(`https://api.replicate.com/v1/predictions/${estado.id}`, {
        headers: { 'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}` }
      })
      estado = await revisar.json()
      intentos++
    }

    if (estado.status === 'failed') {
      return NextResponse.json({ error: 'Falló', detalle: estado.error }, { status: 500 })
    }

    const urlImagen = Array.isArray(estado.output) ? estado.output[0] : estado.output
    return NextResponse.json({ imagen: urlImagen })

  } catch (err: any) {
    console.error('❌ Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
