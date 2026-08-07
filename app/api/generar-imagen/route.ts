import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log('📥 Prompt:', body.prompt?.substring(0, 50) + '...')

    if (!body.prompt) {
      return NextResponse.json({ error: 'El prompt es obligatorio' }, { status: 400 })
    }

    // 🔥 MODELO CORRECTO
    const MODELO = 'zsxkib/instant-id-ipadapter-plus-face'
    
    const input: any = {
      prompt: body.prompt,
      negative_prompt: 'feo, deformado, borroso, baja calidad, dibujo, caricatura, anime, CGI, pintura',
      num_inference_steps: 30,
      guidance_scale: 5,
      disable_safety_checker: true  // 🔥 Desactiva el filtro de seguridad
    }

    // Si hay imagen de referencia
    if (body.ip_adapter_image) {
      console.log('🖼️ Con imagen de referencia')
      input.image = body.ip_adapter_image  // El modelo espera 'image'
    }

    console.log('🚀 Enviando a Replicate...')

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
      return NextResponse.json({ 
        error: 'Error en Replicate', 
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
