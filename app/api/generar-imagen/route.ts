import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const cuerpoCrudo = await req.text()
    console.log('📥 Datos recibidos:', cuerpoCrudo)

    let input
    try {
      input = JSON.parse(cuerpoCrudo)
    } catch {
      return NextResponse.json({ error: 'Formato incorrecto' }, { status: 400 })
    }

    if (input.ip_adapter_image) {
      if (typeof input.ip_adapter_image !== 'string' || !input.ip_adapter_image.startsWith('http')) {
        return NextResponse.json({ error: 'La imagen debe subirse primero', status: 400 })
      }
    }

    const crear = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: 'lucataco/juggernaut-xl-v9:bea09cf018e513cef0841719559ea86d2299e05448633ac8fe270b5d5cd6778c',
        input: {
          prompt: input.prompt,
          negative_prompt: 'cara distinta, rasgos cambiados, feo, deformado, manos mal hechas, borroso, baja calidad',
          num_inference_steps: 35,
          guidance_scale: 7.5,
          disable_safety_checker: true,
          ip_adapter_image: input.ip_adapter_image,
          ip_adapter_scale: 0.8
        }
      })
    })

    const textoRespuesta = await crear.text()
    console.log('📤 Respuesta Replicate:', textoRespuesta)

    let prediccion
    try {
      prediccion = JSON.parse(textoRespuesta)
    } catch {
      return NextResponse.json({ error: 'Error en Replicate', detalle: textoRespuesta }, { status: 500 })
    }

    if (!crear.ok) {
      return NextResponse.json({ error: 'Error de Replicate', detalle: prediccion.error }, { status: crear.status })
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

  } catch (err) {
    console.error('❌ Error total:', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
