
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
    );
import { NextResponse } from "next/server";
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const USUARIOS = new Map();
const GENERACIONES_GRATIS = 1; // 1 video gratis por usuario

export async function POST(request: Request) {
  try {
    const { prompt, imagenRef, userId } = await request.json();

    if (!USUARIOS.has(userId)) {
      USUARIOS.set(userId, 0);
    }
    
    const usos = USUARIOS.get(userId);
    if (usos >= GENERACIONES_GRATIS) {
      return NextResponse.json({
        error: "Se acabó tu video gratis ✨ Compra créditos para seguir"
      }, { status: 403 });
    }

    const salida = await replicate.run(
      "uncensored-com/wan2.1-uncensored-video-lora:46cfc445b5f89469deb11b5d8227ff9e3bb129c8920f3886cd78c426f43204c4",
      {
        input: {
          prompt: `unai, ${prompt}`,
          image: imagenRef,
          negative_prompt: "deformado, borroso, mala calidad, dibujo",
          num_frames: 81,
          fps: 16
        }
      }
    );

    USUARIOS.set(userId, usos + 1);
    return NextResponse.json({ video: salida });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Intenta más tarde por favor" }, { status: 500 });
  }
}
    
    // Contamos el uso
    USUARIOS.set(userId, usos + 1);

    return NextResponse.json({ imagen: salida });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Ocurrió un error, intenta más tarde" }, { status: 500 });
  }
}
