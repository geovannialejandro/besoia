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
    if (!prompt.trim()) return

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
          prompt,
          ...(urlImagen && { image: urlImagen })
        })
      })

      const datos = await respuesta.json()

      if (!respuesta.ok) {
        throw new Error(datos.error || 'No se pudo generar')
      }

      setResultado({ tipo: 'imagen', url: datos.imagen })

    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Algo salió mal')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="space-y-4 w-full max-w-xl mx-auto p-4">
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe tu imagen..."
        className="w-full p-3 border rounded-lg"
      />

      <input type="file" accept="image/*" onChange={alSeleccionarArchivo} />

      {vistaPrevia && <img src={vistaPrevia} className="max-h-40 rounded-lg" />}

      <Button onClick={handleGenerate} disabled={cargando}>
        {cargando ? 'Generando...' : 'Generar'}
      </Button>

      {error && <p className="text-red-500">{error}</p>}

      {resultado && (
        <div>
          <img src={resultado.url} className="rounded-lg" />
          <a href={resultado.url} download target="_blank">
            Descargar
          </a>
        </div>
      )}
    </div>
  )
}
