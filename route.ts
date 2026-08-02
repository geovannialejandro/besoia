
import { NextResponse } from "next/server";
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Contador y créditos
const USUARIOS = new Map();
const GENERACIONES_GRATIS = 2;

export async function POST(request: Request) {
  try {
    const { prompt, userId } = await request.json();

    // Revisamos generaciones gratis
    if (!USUARIOS.has(userId)) {
      USUARIOS.set(userId, 0);
    }
    
    const usos = USUARIOS.get(userId);
    if (usos >= GENERACIONES_GRATIS) {
      return NextResponse.json({
        error: "Se acabaron tus generaciones gratis. Compra créditos para seguir ✨"
      }, { status: 403 });
    }

    // Llamamos a Juggernaut exacto
    const salida = await replicate.run(
      "juggernautxl/juggernaut-xl-v9",
      {
        input: {
          prompt: prompt,
          negative_prompt: "dibujo, caricatura, deformado, mala anatomía, aspecto artificial",
          num_inference_steps: 30,
          guidance_scale: 7.5
        }
      }
    )
    
    // Contamos el uso
    USUARIOS.set(userId, usos + 1);

    return NextResponse.json({ imagen: salida });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Ocurrió un error, intenta más tarde" }, { status: 500 });
  }
}
