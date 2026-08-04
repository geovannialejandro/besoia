'use client'

import { useState } from 'react'

type ResultType = {
  type: 'image' | 'video'
  url: string
} | null

export function BesoiaGenerator() {
  const [prompt, setPrompt] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [result, setResult] = useState<ResultType>(null)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'image' | 'video'>('image')

  async function handleGenerate() {
    if (!prompt) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const endpoint = mode === 'video' ? '/api/video' : '/api/imagen'

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error generando contenido')
      }

      if (mode === 'video') {
        setResult({
          type: 'video',
          url: data.video,
        })
      } else {
        setResult({
          type: 'image',
          url: data.image,
        })
      }
    } catch (err: any) {
      setError(err.message || 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-xl space-y-4">
      {/* Selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode('image')}
          className={`px-4 py-2 rounded-xl ${
            mode === 'image' ? 'bg-primary text-white' : 'bg-muted'
          }`}
        >
          Imagen
        </button>

        <button
          onClick={() => setMode('video')}
          className={`px-4 py-2 rounded-xl ${
            mode === 'video' ? 'bg-primary text-white' : 'bg-muted'
          }`}
        >
          Video
        </button>
      </div>

      {/* Input */}
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe lo que quieres crear..."
        className="w-full rounded-xl border p-3"
      />

      {/* Botón */}
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="w-full rounded-xl bg-primary py-3 text-white"
      >
        {loading ? 'Generando...' : 'Generar'}
      </button>

      {/* Error */}
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}

      {/* Resultado */}
      {result?.type === 'image' && (
        <img
          src={result.url}
          alt="resultado"
          className="rounded-xl"
        />
      )}

      {result?.type === 'video' && (
        <video
          src={result.url}
          controls
          className="rounded-xl"
        />
      )}
    </div>
  )
}
