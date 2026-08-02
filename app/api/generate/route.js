export async function POST(req) {
  const { prompt } = await req.json();

  return Response.json({
    result: "imagen de: " + prompt,
  });
}
