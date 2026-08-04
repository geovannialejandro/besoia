import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()

    if (!prompt) {
      return NextResponse.json({ error: 'Escribe tu descripción' }, { status: 400 })
    }

    const createRes = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: 'uncensored-com/wan2.1-uncensored-video-lora:46cfc445b5f89469deb11b5d8227ff9e3bb129c8920f3886cd78c426f43204c4',
        input: {
          prompt,
          negative_prompt: 'blurry, low quality, deformed, ugly',
          disable_safety_checker: true,
          duration: 5,
          fps: 16,
          sample_steps: 30,
          sample_guide_scale: 5,
        },
      }),
    })

    let result = await createRes.json()

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    for (let i = 0; i < 90; i++) {
      if (result.status === 'succeeded') break
      if (result.status === 'failed' || result.status === 'canceled') {
        return NextResponse.json({ error: result.error || 'El video falló' }, { status: 500 })
      }

      await new Promise((r) => setTimeout(r, 1500))

      const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
        headers: {
          'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        },
      })
      result = await pollRes.json()
    }

    if (result.status !== 'succeeded') {
      return NextResponse.json({ error: 'Tiempo de espera agotado' }, { status: 504 })
    }

    const videoUrl = Array.isArray(result.output) ? result.output[0] : result.output

    return NextResponse.json({ video: videoUrl })

  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ error: error.message || 'Error generando video' }, { status: 500 })
  }
}
