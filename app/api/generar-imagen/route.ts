import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const cuerpoCrudo = await req.text()
    console.log('📥 Datos recibidos:', cuerpoCrudo)

    let input
    try {
      input = JSON.parse(cuerpoCrudo)
    } catch {
      return NextResponse.json({ error: 'Formato inválido' }, { status: 400 })
    }

    // Validar prompt
    if (!input.prompt || typeof input.prompt !== 'string') {
      return NextResponse.json({ error: 'El prompt es requerido' }, { status: 400 })
    }

    // Validar imagen si se envió
    if (input.ip_adapter_image) {
      if (typeof input.ip_adapter_image !== 'string' || !input.ip_adapter_image.startsWith('http')) {
        return NextResponse.json({ error: 'La imagen debe ser una URL válida' }, { status: 400 })
      }
    }

    // 🔥 CONFIGURACIÓN DEL MODELO (CORREGIDA)
    const MODELO = 'sdxl-based/realistic-vision-hyper'
    
    console.log('🚀 Enviando a Replicate con modelo:', MODELO)
    
    const crear = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: MODELO,
        input: {
          prompt: input.prompt,
          negative_prompt: 'feo, deformado, manos mal hechas, borroso, baja calidad, mala anatomía, dibujo, caricatura, CGI, anime, pintura, ilustración',
          num_inference_steps: 30,
          guidance_scale: 4.5,
          disable_safety_checker: true,  // 🔥 CLAVE: Desactiva el filtro
          ...(input.ip_adapter_image && { image: input.ip_adapter_image })  // 🔥 IP-Adapter activado
        }
      })
    })

    const textoRespuesta = await crear.text()
    console.log('📤 Respuesta de Replicate:', textoRespuesta)

    let prediccion
    try {
      prediccion = JSON.parse(textoRespuesta)
    } catch {
      throw new Error(`Respuesta inválida de Replicate: ${textoRespuesta}`)
    }

    if (!crear.ok) {
      console.error('❌ Error de Replicate:', prediccion)
      return NextResponse.json({ 
        error: 'Error en Replicate', 
        detalle: prediccion.error || `Estado ${crear.status}` 
      }, { status: crear.status })
    }

    // Esperar a que termine la generación
    let estado = prediccion
    let intentos = 0
    while (estado.status !== 'succeeded' && estado.status !== 'failed' && intentos < 40) {
      await new Promise(res => setTimeout(res, 2000))
      const revisar = await fetch(`https://api.replicate.com/v1/predictions/${estado.id}`, {
        headers: { 'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}` }
      })
      estado = await revisar.json()
      intentos++
      
      if (intentos % 5 === 0) {
        console.log(`⏳ Esperando... intento ${intentos}`)
      }
    }

    if (estado.status === 'failed') {
      console.error('❌ Predicción fallida:', estado.error)
      return NextResponse.json({ 
        error: 'La generación falló', 
        detalle: estado.error 
      }, { status: 500 })
    }

    const urlImagen = Array.isArray(estado.output) ? estado.output[0] : estado.output
    
    if (!urlImagen) {
      return NextResponse.json({ error: 'No se recibió imagen de Replicate' }, { status: 500 })
    }

    console.log('✅ Imagen generada con éxito:', urlImagen)
    return NextResponse.json({ imagen: urlImagen })

  } catch (err) {
    console.error('💥 Error total:', err)
    return NextResponse.json({ 
      error: 'Error interno del servidor', 
      detalle: (err as Error).message 
    }, { status: 500 })
  }
}
