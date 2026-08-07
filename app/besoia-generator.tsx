'use client'

import { useState } from 'react'
import { Loader2, Download, Sparkles } from 'lucide-react'

const Button = ({ children, onClick, disabled, className }: any) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 ${className}`}
  >
    {children}
  </button>
)

export function BesoiaGenerator() {
  const [prompt, setPrompt] = useState('')
  const [cargando, setCargando] = useState(false)
  const [resultado, setResultado] = useState<{ tipo: 'imagen'; url: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    if (!prompt.trim()) {
      setError('Escribe una descripción')
      return
    }
    setCargando(true)
    setError(null)
    setResultado(null)

    try {
      const respuesta = await fetch('/api/generar-imagen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt })
      })

      const datos = await respuesta.json()
      if (!respuesta.ok) throw new Error(datos.error || 'No se pudo generar')
      setResultado({ tipo: 'imagen', url: datos.imagen })

    } catch (err: any) {
      setError(err.message || 'Algo salió mal')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="space-y-4 w-full max-w-xl mx-auto p-4">
      <div className="space-y-2">
        <label className="font-medium">Tu descripción:</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Escribe cómo quieres que se vea la imagen..."
          className="w-full p-3 rounded-lg border resize-none h-24"
        />
      </div>

      <Button
        onClick={handleGenerate}
        disabled={cargando || !prompt.trim()}
        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 text-lg"
      >
        {cargando ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
        {cargando ? 'Generando...' : 'Crear Imagen'}
      </Button>

      {error && (
        <div className="p-3 bg-red-50 border border-red-300 text-red-700 rounded-lg text-sm font-medium">
          ❌ {error}
        </div>
      )}

      {resultado && (
        <div className="space-y-3 mt-4">
          <p className="font-semibold text-green-700">✅ ¡Listo!</p>
          <img src={resultado.url} alt="Imagen generada" className="w-full rounded-lg shadow-lg" />
          <a
            href={resultado.url}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            <Download className="w-4 h-4" /> Descargar imagen
          </a>
        </div>
      )}
    </div>
  )
}
