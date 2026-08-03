export async function POST(req) {
  const { prompt } = await req.json();

  if (!prompt) {
    return Response.json({ error: "Escribe tu descripción" }, { status: 400 });
  }

  // ✅ PRUEBA SIN GASTAR NADA
  return Response.json({
    image: "https://via.placeholder.com/768?text=" + encodeURIComponent(prompt),
  });
}

