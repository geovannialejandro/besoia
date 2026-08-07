import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log('📥 Prompt:', body.prompt?.substring(0, 50) + '...')

    if (!body.prompt) {
      return NextResponse.json({ error: 'El prompt es obligatorio' }, { status: 400 })
    }

    // 🔥 MODELO CONFIRMADO QUE FUNCIONA
    // Usamos el modelo SDXL base de stability-ai pero con la versión correcta
    const MODELO = 'stability-ai/stable-diffusion:db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf'
    
    console.log('🚀 Usando modelo:', MODELO)

    const input: any = {
      prompt: body.prompt,
      negative_prompt: 'feo, deformado, borroso, baja calidad, dibujo, caricatura, anime',
      width: 1024,
      height: 1024,
      num_outputs: 1,
      num_inference_steps: 30,
      guidance_scale: 7.5,
      disable_safety_checker: true  // 🔥 Desactiva el filtro
    }

    // Si hay imagen de referencia (img2img)
    if (body.ip_adapter_image) {
      console.log('🖼️ Con imagen de referencia (img2img)')
      input.image = body.ip_adapter_image
      // Para img2img, necesitamos estos parámetros extra
      input.strength = 0.8  // Qué tanto se parece a la original (0-1)
      input.num_inference_steps = 40  // Más pasos para img2img
    }

    console.log('📤 Enviando a Replicate...')

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

    if (!response.ok) {
      console.error('❌ Error Replicate:', prediction)
      
      let mensajeError = 'Error en Replicate'
      if (prediction.detail?.includes('balance')) {
        mensajeError = '💳 Sin créditos suficientes'
      } else if (prediction.detail?.includes('not found')) {
        mensajeError = '🔍 Modelo no encontrado'
      } else {
        mensajeError = prediction.detail || prediction.error || 'Error desconocido'
      }
      
      return NextResponse.json({ 
        error: mensajeError,
        detalle: prediction.detail || prediction.error
      }, { status: response.status })
    }

    // Esperar resultado
    let result = prediction
    let attempts = 0
    while (result.status !== 'succeeded' && result.status !== 'failed' && attempts < 40) {
      await new Promise(resolve => setTimeout(resolve, 2000))
      const check = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
        headers: { 'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}` }
      })
      result = await check.json()
      attempts++
      console.log(`⏳ Intento ${attempts}: ${result.status}`)
    }

    if (result.status === 'failed') {
      console.error('❌ Generación fallida:', result.error)
      return NextResponse.json({ 
        error: 'Generación fallida', 
        detalle: result.error 
      }, { status: 500 })
    }

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
