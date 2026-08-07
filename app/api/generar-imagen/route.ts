import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const cuerpoCrudo = await req.text()
    console.log('Datos recibidos:', cuerpoCrudo)

    let input
    try {
      input = JSON.parse(cuerpoCrudo)
    } catch {
      return NextResponse.json({ error: 'Formato incorrecto' }, { status: 400 })
    }

    if (input.ip_adapter_image) {
      if (typeof input.ip_adapter_image !== 'string' || !input.ip_adapter_image.startsWith('http')) {
        return NextResponse.json({ error: 'La imagen debe ser una dirección web válida', status: 400 })
      }
    }

    const crear = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: 'lucataco/realistic-vision-v5.1-ipadapter:cf1669214b850d270608093c2a068b07292125c1',
        input: {
          prompt: input.prompt,
          negative_prompt: 'cara distinta, rasgos cambiados, feo, deformado, manos mal hechas, borroso, baja calidad',
          num_inference_steps: 35,
          guidance_scale: 7.5,
          disable_safety_checker: true,
          ip_adapter_image: input.ip_adapter_image
        }
      })
    })

    const textoRespuesta = await crear.text()
    console.log('Respuesta Replicate:', textoRespuesta)

    let prediccion
    try {
      prediccion = JSON.parse(textoRespuesta)
    } catch {
      throw new Error(`Respuesta inválida: ${textoRespuesta}`)
    }

    if (!crear.ok) throw new Error(prediccion.error || `Error ${crear.status}`)

    let estado = prediccion
    let intentos = 0
    while (estado.status !== 'succeeded' && estado.status !== 'failed' && intentos < 50) {
      await new Promise(res => setTimeout(res, 2000))
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
    console.error('Error total:', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
