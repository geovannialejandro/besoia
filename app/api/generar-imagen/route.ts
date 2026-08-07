import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log('📥 Prompt recibido:', body.prompt?.substring(0, 50) + '...')

    // Validaciones básicas
    if (!body.prompt) {
      return NextResponse.json({ error: 'El prompt es obligatorio' }, { status: 400 })
    }

    // 🔥 MODELO ESPECIALIZADO EN IDENTIDAD (CON IP-ADAPTER)
    // Este modelo SÍ mantiene la cara de la imagen de referencia
    const MODELO = 'tencentarc/photomaker:caa9c5c4cd49d6c83f8b51d10c82f0c359f09df7a4da32abdb630efef55166e4'
    
    console.log('🚀 Usando modelo con IP-Adapter:', MODELO)

    // Construir el input para Replicate
    const input: any = {
      prompt: body.prompt,
      negative_prompt: 'feo, deformado, borroso, baja calidad, dibujo, caricatura, anime, CGI, pintura',
      num_inference_steps: 35,
      guidance_scale: 5.0,
      width: 1024,
      height: 1024,
      // 🔥 PARÁMETRO CLAVE: Activar IP-Adapter
      style: 'Photographic',  // Estilo realista
      input_image: body.ip_adapter_image || null  // La imagen de referencia
    }

    // Si NO hay imagen de referencia, usamos el modo normal
    if (!body.ip_adapter_image) {
      delete input.input_image
      delete input.style
    } else {
      console.log('🖼️ Usando imagen de referencia para mantener identidad')
    }

    console.log('📤 Enviando a Replicate...')

    // Crear la predicción
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: MODELO,
        input: input
      })
    })

    const prediction = await response.json()
    console.log('📥 Respuesta de Replicate:', JSON.stringify(prediction, null, 2))

    if (!response.ok) {
      console.error('❌ Error de Replicate:', prediction)
      return NextResponse.json({ 
        error: 'Error al crear la predicción', 
        detalle: prediction.error || 'Replicate rechazó la solicitud'
      }, { status: response.status })
    }

    // Esperar a que termine
    let result = prediction
    let attempts = 0
    while (result.status !== 'succeeded' && result.status !== 'failed' && attempts < 40) {
      await new Promise(resolve => setTimeout(resolve, 2000))
      const check = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
        headers: { 'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}` }
      })
      result = await check.json()
      attempts++
      console.log(`⏳ Intentos: ${attempts}, Estado: ${result.status}`)
    }

    if (result.status === 'failed') {
      console.error('❌ Generación fallida:', result.error)
      return NextResponse.json({ 
        error: 'La generación falló', 
        detalle: result.error 
      }, { status: 500 })
    }

    // Obtener la URL de la imagen
    const imageUrl = Array.isArray(result.output) ? result.output[0] : result.output
    
    if (!imageUrl) {
      return NextResponse.json({ error: 'No se recibió imagen' }, { status: 500 })
    }

    console.log('✅ Imagen generada con identidad preservada:', imageUrl)
    return NextResponse.json({ imagen: imageUrl })

  } catch (error) {
    console.error('💥 Error:', error)
    return NextResponse.json({ 
      error: 'Error interno', 
      detalle: (error as Error).message 
    }, { status: 500 })
  }
}
