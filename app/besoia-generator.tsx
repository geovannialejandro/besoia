'use client'

import { useState } from 'react'

export function BesoiaGenerator() {
  const [prompt, setPrompt] = useState('')
  const [mode, setMode] = useState<'image' | 'video'>('image')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ type: 'image' | 'video'; url: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

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
        throw new Error(data.error || 'Error generando')
      }

      if (mode === 'video') {
        setResult({ type: 'video', url: data.video })
      } else {
        setResult({ type: 'image', url: data.image })
      }
    } catch (err: any) {
      setError(err.message || 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-xl space-y-4">
      {/* Botones Imagen / Video */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode('image')}
          className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium ${
            mode === 'image' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
          }`}
        >
          Imagen
        </button>
        <button
          onClick={() => setMode('video')}
          className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium ${
            mode === 'video' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
          }`}
        >
          Video
        </button>
      </div>

      {/* Prompt */}
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe lo que quieres crear..."
        className="w-full rounded-xl border border-border bg-background p-4 min-h-[110px] text-sm"
      />

      {/* Botón Generar */}
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="w-full rounded-xl bg-primary py-3.5 text-white font-medium disabled:opacity-50"
      >
        {loading ? 'Generando...' : 'Generar Ahora'}
      </button>

      {/* Error */}
      {error && <p className="text-red-500 text-sm text-center">{error}</p>}

      {/* Resultado */}
      {result?.type === 'image' && (
        <img src={result.url} alt="Resultado" className="w-full rounded-xl shadow-lg" />
      )}

      {result?.type === 'video' && (
        <video src={result.url} controls className="w-full rounded-xl shadow-lg" />
      )}
    </div>
  )
}
