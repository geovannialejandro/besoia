import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { prompt, imagen } = await req.json()
    const res = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: 'uncensored-com/wan2.1-uncensored-video-lora:46cfc445b5f89469deb11b5d8227ff9e3bb129c8920f3886cd78c426f432',
        input: {
          prompt: prompt,
          first_frame_image: imagen || '',
          num_frames: 81,
          fps: 16
        }
      })
    })
    const data = await res.json()
    return NextResponse.json({ video: data.output?.[0] || data.output })
  } catch (e) {
    return NextResponse.json({ error: 'No se pudo generar el video', status: 500 })
  }
}

