import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log('📥 Prompt recibido:', body.prompt?.substring(0, 50) + '...')

    // Validaciones básicas
    if (!body.prompt) {
      return NextResponse.json({ error: 'El prompt es obligatorio' }, { status: 400 })
    }

    // 🔥 USAR ESTE MODELO - Está probado y funciona
    const MODELO = 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b'
    
    console.log('🚀 Usando modelo:', MODELO)

    // Construir el input para Replicate
    const input: any = {
      prompt: body.prompt,
      negative_prompt: 'feo, deformado, borroso, baja calidad, dibujo, caricatura, anime',
      width: 1024,
      height: 1024,
      num_inference_steps: 30,
      guidance_scale: 7.5,
      // 🔥 CLAVE: Desactivar el filtro de seguridad
      disable_safety_checker: true
    }

    // Si hay imagen de referencia, añadirla (solo si el modelo la soporta)
    if (body.ip_adapter_image) {
      console.log('🖼️ Con imagen de referencia:', body.ip_adapter_image.substring(0, 50) + '...')
      // Para SDXL base, la imagen de referencia se usa como "image" 
      // pero NO todos los modelos la soportan, por eso lo ponemos condicional
      input.image = body.ip_adapter_image
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
    while (result.status !== 'succeeded' && result.status !== 'failed' && attempts < 30) {
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

    console.log('✅ Imagen generada:', imageUrl)
    return NextResponse.json({ imagen: imageUrl })

  } catch (error) {
    console.error('💥 Error:', error)
    return NextResponse.json({ 
      error: 'Error interno', 
      detalle: (error as Error).message 
    }, { status: 500 })
  }
                                                                            }
