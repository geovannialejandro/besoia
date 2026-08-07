import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('📥 Prompt recibido:', body.prompt?.substring(0, 50) + '...');

    if (!body.prompt) {
      return NextResponse.json({ error: 'El prompt es obligatorio' }, { status: 400 });
    }

    // 🔥 EL MODELO JUGGERNAUT XL LIGHTNING CON EL HASH CORRECTO
    const MODELO = 'sdxl-based/juggernaut-xl-lightning:c9a24c321ceb0b7843b872dcae82109dddadd1f82e94b115ee39289e0e182e40';
    
    console.log('🚀 Usando modelo:', MODELO);

    // 🔥 CONSTRUCCIÓN DE PARÁMETROS CON EL disable_safety_checker
    const input: any = {
      prompt: body.prompt,
      negative_prompt: 'feo, deformado, borroso, baja calidad, dibujo, caricatura, anime, CGI, pintura',
      num_inference_steps: 5,      // ⚡ Es un modelo Lightning, solo necesita 5-7 pasos
      guidance_scale: 2,           // 📉 CFG bajo para la versión Lightning
      width: 1024,
      height: 1024,
      disable_safety_checker: true // 🔥 EL PARÁMETRO CLAVE PARA DESACTIVAR EL FILTRO
    };

    // Si hay imagen de referencia, se añade al input
    if (body.ip_adapter_image) {
      console.log('🖼️ Con imagen de referencia');
      input.image = body.ip_adapter_image;
    }

    console.log('📤 Enviando a Replicate...');

    // 🔥 LLAMADA DIRECTA A LA API DE REPLICATE
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
    });

    const prediction = await response.json();

    if (!response.ok) {
      console.error('❌ Error de Replicate:', prediction);
      return NextResponse.json({
        error: 'Error en Replicate',
        detalle: prediction.detail || prediction.error
      }, { status: response.status });
    }

    // ⏳ ESPERAR A QUE LA GENERACIÓN TERMINE (POLLING)
    let result = prediction;
    let attempts = 0;
    while (result.status !== 'succeeded' && result.status !== 'failed' && attempts < 40) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const check = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
        headers: { 'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}` }
      });
      result = await check.json();
      attempts++;
      console.log(`⏳ Intento ${attempts}: ${result.status}`);
    }

    if (result.status === 'failed') {
      console.error('❌ Generación fallida:', result.error);
      return NextResponse.json({
        error: 'Generación fallida',
        detalle: result.error
      }, { status: 500 });
    }

    const imageUrl = Array.isArray(result.output) ? result.output[0] : result.output;

    if (!imageUrl) {
      return NextResponse.json({ error: 'No se recibió imagen' }, { status: 500 });
    }

    console.log('✅ Imagen generada con éxito:', imageUrl);
    return NextResponse.json({ imagen: imageUrl });

  } catch (error) {
    console.error('💥 Error inesperado:', error);
    return NextResponse.json({
      error: 'Error interno del servidor',
      detalle: (error as Error).message
    }, { status: 500 });
  }
}
