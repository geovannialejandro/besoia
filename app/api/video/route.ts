export async function POST(req) {
  const { prompt } = await req.json();

  if (!prompt) {
    return Response.json({ error: "Escribe tu descripción" }, { status: 400 });
  }

  // ✅ PRUEBA SIN GASTAR NADA
  return Response.json({
    video: "https://samplelib.com/lib/preview/mp4/sample-5s.mp4",
  });
}

