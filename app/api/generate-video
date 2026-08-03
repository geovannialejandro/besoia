import { NextResponse } from "next/server";
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const USUARIOS_VIDEO = new Map();
const VIDEO_GRATIS = 1;

export async function POST(request: Request) {
  try {
    const { prompt, imagenRef, userId } = await request.json();

    if (!USUARIOS_VIDEO.has(userId)) {
      USUARIOS_VIDEO.set(userId, 0);
    }
    
    const usos = USUARIOS_VIDEO.get(userId);
    if (usos >= VIDEO_GRATIS) {
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

    USUARIOS_VIDEO.set(userId, usos + 1);
    return NextResponse.json({ video: salida });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Intenta más tarde por favor" }, { status: 500 });
  }
}
