import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const cuerpoCrudo = await req.text()
    console.log('📥 Recibido del frontend:', cuerpoCrudo)

    let input
    try {
      input = JSON.parse(cuerpoCrudo)
    } catch {
      return NextResponse.json({ error: 'Formato incorrecto' }, { status: 400 })
    }

    if (input.ip_adapter_image) {
      if (typeof input.ip_adapter_image !== 'string' || !input.ip_adapter_image.startsWith('http')) {
        return NextResponse.json({ error: 'La imagen no se subió bien, intenta de nuevo', status: 400 })
      }
    }

    console.log('🤖 Llamando a Replicate...')
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
          negative_prompt: 'cara distinta, rasgos cambiados, feo, deformado, manos mal hechas, borroso, baja calidad, dibujo, caricatura',
          num_inference_steps: 35,
          guidance_scale: 7.5,
          disable_safety_checker: true,
          ip_adapter_image: input.ip_adapter_image,
          ip_adapter_scale: 0.85
        }
      })
    })

    const textoRespuesta = await crear.text()
    console.log('📤 Respuesta de Replicate:', textoRespuesta)

    let prediccion
    try {
      prediccion = JSON.parse(textoRespuesta)
    } catch {
      return NextResponse.json({ error: 'Replicate devolvió un error', detalle: textoRespuesta }, { status: 500 })
    }

    if (!crear.ok) {
      return NextResponse.json({ 
        error: prediccion.error || 'Error en Replicate', 
        detalle: prediccion 
      }, { status: crear.status })
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
      console.log(`⏳ Esperando... intento ${intentos}: ${estado.status}`)
    }

    if (estado.status === 'failed') {
      return NextResponse.json({ error: 'No se pudo generar', detalle: estado.error }, { status: 500 })
    }

    const urlImagen = Array.isArray(estado.output) ? estado.output[0] : estado.output
    console.log('✅ Imagen lista:', urlImagen)
    return NextResponse.json({ imagen: urlImagen })

  } catch (err: any) {
    console.error('❌ Error total:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
