import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('📥 Prompt:', body.prompt?.substring(0, 50) + '...');

    if (!body.prompt) {
      return NextResponse.json({ error: 'El prompt es obligatorio' }, { status: 400 });
    }

    // 🔥 USANDO EL MODELO JUGGERNAUT CON EL HASH CORRECTO
    const MODELO = 'sdxl-based/juggernaut-xl-lightning:c9a24c321ceb0b7843b872dcae82109dddadd1f82e94b115ee39289e0e182e40';
    
    console.log('🚀 Usando modelo:', MODELO);

    const input = {
      prompt: body.prompt,
      negative_prompt: 'feo, deformado, borroso, baja calidad, dibujo, caricatura, anime, CGI',
      num_inference_steps: 5,  // ⚡ Es un modelo "Lightning", solo necesita 5-7 pasos [citation:10]
      guidance_scale: 2,       // 📉 CFG bajo para la versión Lightning [citation:10]
      width: 1024,
      height: 1024,
      disable_safety_checker: true  // 🔥 EL PARÁMETRO CLAVE PARA DESACTIVAR EL FILTRO [citation:4]
    };

    console.log('📤 Enviando a Replicate...');

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
      console.error('❌ Error Replicate:', prediction);
      return NextResponse.json({ 
        error: 'Error en Replicate', 
        detalle: prediction.detail || prediction.error 
      }, { status: response.status });
    }

    // Esperar resultado
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

    console.log('✅ Imagen generada:', imageUrl);
    return NextResponse.json({ imagen: imageUrl });

  } catch (error) {
    console.error('💥 Error:', error);
    return NextResponse.json({ 
      error: 'Error interno', 
      detalle: (error as Error).message 
    }, { status: 500 });
  }
}
