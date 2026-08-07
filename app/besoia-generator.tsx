'use client'

import { useState } from 'react'
import { Loader2, Download, Sparkles, Upload } from 'lucide-react'

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
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null)
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)
  const [resultado, setResultado] = useState<{ tipo: 'imagen'; url: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function subirImagen(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', 'besoia_upload')
    formData.append('cloud_name', 'yysjrhit')

    const res = await fetch('https://api.cloudinary.com/v1_1/yysjrhit/image/upload', {
      method: 'POST',
      body: formData
    })

    if (!res.ok) throw new Error('No se pudo subir la imagen')
    const datos = await res.json()
    return datos.secure_url
  }

  function alSeleccionarArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0] || null
    setArchivoSeleccionado(archivo)
    setVistaPrevia(archivo ? URL.createObjectURL(archivo) : null)
  }

  async function handleGenerate() {
    if (!prompt.trim()) {
      setError('Por favor, escribe una descripción')
      return
    }

    setCargando(true)
    setError(null)
    setResultado(null)

    try {
      let urlImagen = null
      if (archivoSeleccionado) {
        urlImagen = await subirImagen(archivoSeleccionado)
      }

      const respuesta = await fetch('/api/generar-imagen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt,
          ip_adapter_image: urlImagen
        })
      })

      const datos = await respuesta.json()

      if (!respuesta.ok) {
        throw new Error(datos.error || datos.detalle || 'Error al generar la imagen')
      }

      setResultado({ tipo: 'imagen', url: datos.imagen })

    } catch (err) {
      console.error('Error:', err)
      setError(err instanceof Error ? err.message : 'Algo salió mal')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="space-y-4 w-full max-w-xl mx-auto p-4">
      <div className="space-y-2">
        <label className="font-medium">📝 Descripción de la imagen:</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ej: Una foto profesional de una persona en un estudio, iluminación suave, fondo oscuro..."
          className="w-full p-3 rounded-lg border resize-none h-24"
        />
      </div>

      <div className="space-y-2">
        <label className="font-medium">🖼️ Imagen de referencia (opcional):</label>
        <div className="flex items-center gap-2">
          <Upload className="w-5 h-5 text-gray-500" />
          <input
            type="file"
            accept="image/*"
            onChange={alSeleccionarArchivo}
            className="text-sm"
          />
          {archivoSeleccionado && (
            <span className="text-xs text-green-600">✅ {archivoSeleccionado.name}</span>
          )}
        </div>
        {vistaPrevia && (
          <div className="mt-2">
            <p className="text-sm text-gray-600 mb-1">Vista previa:</p>
            <img src={vistaPrevia} alt="Vista previa" className="max-h-40 rounded-lg border" />
          </div>
        )}
      </div>

      <Button
        onClick={handleGenerate}
        disabled={cargando || !prompt.trim()}
        className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3"
      >
        {cargando ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
        {cargando ? '⏳ Generando...' : '🚀 Generar Imagen'}
      </Button>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          ❌ {error}
        </div>
      )}

      {resultado && (
        <div className="space-y-3 mt-4">
          <p className="font-medium">✅ Imagen generada:</p>
          <img src={resultado.url} alt="Imagen generada" className="w-full rounded-lg shadow-lg" />
          <a
            href={resultado.url}
            download={`imagen-${Date.now()}.png`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-amber-700 hover:text-amber-900 text-sm font-medium"
          >
            <Download className="w-4 h-4" /> ⬇️ Descargar imagen
          </a>
        </div>
      )}
    </div>
  )
}
