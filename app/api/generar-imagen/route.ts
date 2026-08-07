import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    // Leemos y validamos lo que llega
    const cuerpoCrudo = await req.text()
    console.log('Datos recibidos:', cuerpoCrudo)

    let input
    try {
      input = JSON.parse(cuerpoCrudo)
    } catch {
      return NextResponse.json(
        { error: 'Formato incorrecto en la solicitud' },
        { status: 400 }
      )
    }

    // Validamos que si viene imagen sea una URL
    if (input.ip_adapter_image && typeof input.ip_adapter_image !== 'string') {
      return NextResponse.json(
        { error: 'La referencia debe ser una dirección de imagen' },
        { status: 400 }
      )
    }

    // Llamamos a Replicate
    const crear = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: 'lucataco/realvis-xl-v4:cf1669214b850d270608093c2a068b07292125c1',
        input: {
          prompt: input.prompt,
          negative_prompt: 'feo, deformado, manos mal hechas, borroso, baja calidad',
          num_inference_steps: 30,
          guidance_scale: 7.5,
          ...(input.ip_adapter_image && { ip_adapter_image: input.ip_adapter_image })
        }
      })
    })

    const textoRespuesta = await crear.text()
    console.log('Respuesta de Replicate:', textoRespuesta)

    let prediccion
    try {
      prediccion = JSON.parse(textoRespuesta)
    } catch {
      throw new Error(`Respuesta inválida: ${textoRespuesta}`)
    }

    if (!crear.ok) throw new Error(prediccion.error || `Error ${crear.status}`)

    // Esperamos a que termine
    let estado = prediccion
    let intentos = 0

    while (
      estado.status !== 'succeeded' &&
      estado.status !== 'failed' &&
      intentos < 40
    ) {
      await new Promise(res => setTimeout(res, 2000))
      
      const revisar = await fetch(`https://api.replicate.com/v1/predictions/${estado.id}`, {
        headers: { 'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}` }
      })
      
      estado = await revisar.json()
      intentos++
    }

    if (estado.status === 'failed') {
      return NextResponse.json({
        error: 'Falló la generación',
        detalle: estado.error || 'Sin detalles'
      }, { status: 500 })
    }

    const urlImagen = Array.isArray(estado.output) ? estado.output[0] : estado.output
    return NextResponse.json({ imagen: urlImagen })

  } catch (err) {
    console.error('Error total:', err)
    return NextResponse.json({
      error: (err as Error).message || 'Algo salió mal'
    }, { status: 500 })
  }
      }
