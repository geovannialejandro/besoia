'use client'

import { useState } from 'react'

export default function BesoiaGenerator() {
  const [prompt, setPrompt] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [resultImage, setResultImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setPreview(URL.createObjectURL(file))
    }
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Escribe un prompt')
      return
    }
    if (!imageFile) {
      setError('Sube una imagen de referencia')
      return
    }

    setLoading(true)
    setError('')
    setResultImage(null)

    try {
      // Convertimos la imagen a base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(imageFile)
      })

      const res = await fetch('/api/generar-imagen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          image: base64, // enviamos la imagen en base64
        }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Error al generar la imagen')
      }

      setResultImage(data.image)
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold text-center">Besoia Generator</h1>

      {/* Prompt */}
      <div>
        <label className="block text-sm font-medium mb-1">Prompt</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ej: beautiful woman, natural skin, soft lighting, photorealistic..."
          className="w-full h-28 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      {/* Imagen de referencia */}
      <div>
        <label className="block text-sm font-medium mb-1">Imagen de referencia (cara)</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
        />
        {preview && (
          <img
            src={preview}
            alt="Preview"
            className="mt-3 w-32 h-32 object-cover rounded-lg border"
          />
        )}
      </div>

      {/* Botón */}
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading ? 'Generando...' : 'Generar Ahora'}
      </button>

      {/* Error */}
      {error && (
        <p className="text-red-500 text-center text-sm">{error}</p>
      )}

      {/* Resultado */}
      {resultImage && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2 text-center">Resultado</h2>
          <img
            src={resultImage}
            alt="Imagen generada"
            className="w-full rounded-xl shadow-lg"
          />
        </div>
      )}
    </div>
  )
}
