import { NextResponse } from 'next/server'
import { getModel, type ModelId } from '@/lib/models'

export const maxDuration = 300

const REPLICATE_API = 'https://api.replicate.com/v1'

// Replicate slugs for each model exposed in the UI.
const REPLICATE_SLUGS: Record<ModelId, string> = {
  'cyberrealistic-xl': 'aisha-ai-official/cyber-realistic-xl-v5',
  'faceid-sdxl': 'zsxkib/instant-id',
  liveportrait: 'fofr/live-portrait',
}

interface GenerateBody {
  model?: ModelId
  prompt?: string
  faceImage?: string
  drivingVideo?: string
}

async function getLatestVersion(slug: string, token: string) {
  const res = await fetch(`${REPLICATE_API}/models/${slug}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  if (!res.ok) {
    throw new Error('No se pudo encontrar el modelo solicitado.')
  }
  const data = await res.json()
  const version = data?.latest_version?.id
  if (!version) throw new Error('El modelo no tiene una versión disponible.')
  return version as string
}

async function pollPrediction(url: string, token: string) {
  // Poll the prediction until it succeeds, fails, or is canceled.
  const deadline = Date.now() + 280_000
  while (Date.now() < deadline) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    const prediction = await res.json()

    if (prediction.status === 'succeeded') return prediction
    if (prediction.status === 'failed' || prediction.status === 'canceled') {
      throw new Error(prediction.error || 'La generación falló. Intenta de nuevo.')
    }
    await new Promise((r) => setTimeout(r, 1500))
  }
  throw new Error('La generación tardó demasiado. Intenta de nuevo.')
}

function buildInput(
  modelId: ModelId,
  body: GenerateBody,
): Record<string, unknown> {
  const prompt = (body.prompt ?? '').trim()
  switch (modelId) {
    case 'cyberrealistic-xl':
      return { prompt, width: 1024, height: 1024 }
    case 'faceid-sdxl':
      return { image: body.faceImage, prompt }
    case 'liveportrait':
      return { face_image: body.faceImage, driving_video: body.drivingVideo }
  }
}

export async function POST(request: Request) {
  const token = process.env.REPLICATE_API_TOKEN
  if (!token) {
    return NextResponse.json(
      { error: 'Falta configurar REPLICATE_API_TOKEN en el proyecto.' },
      { status: 500 },
    )
  }

  let body: GenerateBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 })
  }

  const model = body.model ? getModel(body.model) : undefined
  if (!model) {
    return NextResponse.json({ error: 'Selecciona un modelo válido.' }, { status: 400 })
  }

  const prompt = (body.prompt ?? '').trim()
  if (model.needsPrompt && !prompt) {
    return NextResponse.json({ error: 'Escribe una descripción para generar.' }, { status: 400 })
  }
  if (prompt.length > 1000) {
    return NextResponse.json({ error: 'La descripción es demasiado larga.' }, { status: 400 })
  }
  if (model.needsFaceImage && !body.faceImage) {
    return NextResponse.json({ error: 'Sube una foto de rostro de referencia.' }, { status: 400 })
  }
  if (model.needsDrivingVideo && !body.drivingVideo) {
    return NextResponse.json({ error: 'Sube un video guía de referencia.' }, { status: 400 })
  }

  const slug = REPLICATE_SLUGS[model.id]
  const input = buildInput(model.id, body)

  try {
    const version = await getLatestVersion(slug, token)

    // Create the prediction against the model's latest version.
    const createRes = await fetch(`${REPLICATE_API}/predictions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: 'wait',
      },
      body: JSON.stringify({ version, input }),
      cache: 'no-store',
    })

    const created = await createRes.json()

    if (!createRes.ok) {
      return NextResponse.json(
        { error: created?.detail || 'No se pudo iniciar la generación.' },
        { status: createRes.status },
      )
    }

    let prediction = created
    if (prediction.status !== 'succeeded') {
      const pollUrl = prediction?.urls?.get
      if (!pollUrl) throw new Error('Respuesta inesperada del servidor de generación.')
      prediction = await pollPrediction(pollUrl, token)
    }

    // Output can be a string or an array of URLs depending on the model.
    const output = prediction.output
    const url = Array.isArray(output) ? output[output.length - 1] : output

    if (!url || typeof url !== 'string') {
      throw new Error('No se recibió ningún resultado.')
    }

    return NextResponse.json({ url, type: model.mediaType })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Ocurrió un error inesperado.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
