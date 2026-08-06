'use client'

import { useState } from 'react'
import { Loader2, Download, Sparkles, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function BesoiaGenerator() {
  const [modo, setModo] = useState<'imagen' | 'ropa' | 'animar' | 'video'>('imagen')
  const [prompt, setPrompt] = useState('')
  const [opcionRopa, setOpcionRopa] = useState('')
  const [ropaPersonalizada, setRopaPersonalizada] = useState('')
  const [archivo, setArchivo] = useState<File | null>(null)
  const [cargando, setCargando] = useState(false)
  const [resultado, setResultado] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // ✅ RUTAS YA CORREGIDAS EXACTAS A TUS CARPETAS
  const rutas = {
    imagen: '/api/generar-imagen',
    ropa: '/api/cambiar-ropa',
    animar: '/api/animar-foto',
    video: '/api/generar-video'
  }

  async function generar() {
    setCargando(true)
    setError(null)
    setResultado(null)

    try {
      let cuerpo: any = {}
      let cabeceras: any = {}

      if (modo === 'imagen' || modo === 'video') {
        cuerpo = { prompt }
        cabeceras = { 'Content-Type': 'application/json' }
      } else {
        if (!archivo) throw new Error('Sube tu foto primero')
        const form = new FormData()
        form.append('foto', archivo)
        
        const ropaFinal = ropaPersonalizada || opcionRopa
        if (modo === 'ropa' && ropaFinal) form.append('descripcion', ropaFinal)

        cuerpo = form
      }

      const respuesta = await fetch(rutas[modo], {
        method: 'POST',
        headers: modo === 'imagen' || modo === 'video' ? cabeceras : {},
        body: modo === 'imagen' || modo === 'video' ? JSON.stringify(cuerpo) : cuerpo
      })

      const datos = await respuesta.json()
      if (!respuesta.ok) throw new Error(datos.error || 'Algo salió mal')

      setResultado(datos.imagen || datos.video)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-5 bg-black/70 rounded-2xl border border-amber-600">
      
      <div className="mb-6">
        <h3 className="text-amber-400 font-bold mb-3 text-center text-lg">✨ Elige lo que quieres hacer</h3>
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => setModo('imagen')}
            className={`p-3 rounded-xl font-medium transition-all ${
              modo === 'imagen' ? 'bg-amber-500 text-black' : 'bg-gray-800 text-white hover:bg-gray-700'
            }`}
          >
            🖼️ Generar Imagen
          </button>

          <button 
            onClick={() => setModo('ropa')}
            className={`p-3 rounded-xl font-medium transition-all ${
              modo === 'ropa' ? 'bg-amber-500 text-black' : 'bg-gray-800 text-white hover:bg-gray-700'
            }`}
          >
            👕 Cambiar Ropa
          </button>

          <button 
            onClick={() => setModo('animar')}
            className={`p-3 rounded-xl font-medium transition-all ${
              modo === 'animar' ? 'bg-amber-500 text-black' : 'bg-gray-800 text-white hover:bg-gray-700'
            }`}
          >
            ✨ Animar Foto
          </button>

          <button 
            onClick={() => setModo('video')}
            className={`p-3 rounded-xl font-medium transition-all ${
              modo === 'video' ? 'bg-amber-500 text-black' : 'bg-gray-800 text-white hover:bg-gray-700'
            }`}
          >
            🎬 Video Corto
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {(modo === 'imagen' || modo === 'video') && (
          <div>
            <label className="text-white font-medium mb-2 block">Escribe tu descripción:</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ej: foto realista en la playa..."
              className="w-full p-3 rounded-lg bg-gray-900 border border-amber-700 text-white"
              rows={3}
            />
          </div>
        )}

        {(modo === 'ropa' || modo === 'animar') && (
          <div>
            <label className="text-white font-medium mb-2 block">Sube tu foto:</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setArchivo(e.target.files?.[0] || null)}
              className="w-full p-3 rounded-lg bg-gray-900 border border-amber-700 text-white"
            />
          </div>
        )}

        {modo === 'ropa' && (
          <>
            <div>
              <label className="text-white font-medium mb-2 block">Elige tipo de ropa:</label>
              <select
                value={opcionRopa}
                onChange={(e) => setOpcionRopa(e.target.value)}
                className="w-full p-3 rounded-lg bg-gray-900 border border-amber-700 text-white"
              >
                <option value="">Selecciona una opción</option>
                <option value="bikini">👙 Bikini</option>
                <option value="traje de baño">🏊 Traje de baño</option>
                <option value="vestido largo">👗 Vestido largo</option>
                <option value="vestido corto">👗 Vestido corto</option>
                <option value="ropa deportiva">🏃 Ropa deportiva</option>
                <option value="ropa de playa">🌴 Ropa de playa</option>
                <option value="lencería">✨ Lencería</option>
                <option value="ropa casual">👕 Ropa casual</option>
              </select>
            </div>

            <div>
              <label className="text-white font-medium mb-2 block">O escribe lo que quieras:</label>
              <input
                type="text"
                value={ropaPersonalizada}
                onChange={(e) => setRopaPersonalizada(e.target.value)}
                placeholder="Ej: vestido rojo elegante..."
                className="w-full p-3 rounded-lg bg-gray-900 border border-amber-700 text-white"
              />
            </div>
          </>
        )}
      </div>

      <Button
        onClick={generar}
        disabled={cargando}
        className="w-full mt-6 py-4 text-lg font-bold bg-amber-500 hover:bg-amber-600 text-black"
      >
        {cargando ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2" />}
        {cargando ? 'Generando...' : '✨ Crear Ahora'}
      </Button>

      {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
      
      {resultado && (
        <div className="mt-6">
          <p className="text-amber-400 text-center mb-3 font-medium">✅ Listo:</p>
          {modo === 'video' ? (
            <video src={resultado} controls autoPlay loop className="w-full rounded-xl" />
          ) : (
            <img src={resultado} alt="Resultado" className="w-full rounded-xl" />
          )}
          <a 
            href={resultado} 
            download 
            target="_blank"
            className="block w-full mt-3 text-center py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800"
          >
            <Download className="inline mr-2" /> Descargar
          </a>
        </div>
      )}
    </div>
  )
}
