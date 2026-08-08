'use client'
import React, { useState } from 'react'

export default function BesoiaGenerator() {
  const [modo, setModo] = useState('generar')
  const [prompt, setPrompt] = useState('')
  const [cargando, setCargando] = useState(false)
  const [mensajeProgreso, setMensajeProgreso] = useState('')
  const [imagenResultado, setImagenResultado] = useState(null)

  const handleCrear = async () => {
    if (!prompt.trim()) {
      alert("Por favor escribe una descripción para generar.")
      return
    }

    setCargando(true)
    setImagenResultado(null)

    setMensajeProgreso("⏳ Alta demanda: Conectando con los servidores de IA...")
    
    setTimeout(() => {
      setMensajeProgreso("🔥 Muchos usuarios generando ahora mismo, tu turno está en proceso...")
    }, 4000)

    setTimeout(() => {
      setMensajeProgreso("✨ Procesando fotorrealismo y afinando detalles...")
    }, 9000)

    setTimeout(() => {
      setMensajeProgreso("🚀 Ya casi terminamos, preparando tu imagen final...")
    }, 16000)

    try {
      const res = await fetch('/api/generar-imagen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, modo })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al generar la imagen')
      }

      setImagenResultado(data.url)
    } catch (error) {
      console.error(error)
      alert("Hubo un error al generar. Intenta de nuevo.")
    } finally {
      setCargando(false)
      setMensajeProgreso("")
    }
  }

  return (
    <div className="max-w-md mx-auto p-4 bg-gray-900 text-white rounded-2xl border border-amber-600/50 shadow-2xl space-y-6">
      
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold text-amber-400">✨ Elige lo que quieres hacer</h2>
        <p className="text-xs text-gray-400">Tu imaginación, BESOIA lo crea.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setModo('generar')}
          className={`p-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
            modo === 'generar' 
              ? 'bg-amber-500 text-gray-950 font-bold shadow-lg shadow-amber-500/20' 
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          🖼️ Generar Imagen
        </button>
        <button
          onClick={() => setModo('ropa')}
          className={`p-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
            modo === 'ropa' 
              ? 'bg-amber-500 text-gray-950 font-bold shadow-lg shadow-amber-500/20' 
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          👕 Cambiar Ropa
        </button>
        <button
          onClick={() => setModo('animar')}
          className={`p-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
            modo === 'animar' 
              ? 'bg-amber-500 text-gray-950 font-bold shadow-lg shadow-amber-500/20' 
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          ✨ Animar Foto
        </button>
        <button
          onClick={() => setModo('video')}
          className={`p-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
            modo === 'video' 
              ? 'bg-amber-500 text-gray-950 font-bold shadow-lg shadow-amber-500/20' 
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          🎬 Video Corto
        </button>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-amber-300 block">
          📝 Escribe tu descripción:
        </label>
        <textarea
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ej: foto realistas en la playa, ultra detallada..."
          className="w-full p-3 bg-gray-950 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 transition-colors resize-none"
        />
      </div>

      <button
        onClick={handleCrear}
        disabled={cargando}
        className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
          cargando 
            ? 'bg-amber-600/40 text-amber-200 cursor-not-allowed border border-amber-500/30' 
            : 'bg-amber-500 hover:bg-amber-400 text-gray-950 shadow-lg shadow-amber-500/20 cursor-pointer'
        }`}
      >
        {cargando ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-xs font-medium">{mensajeProgreso}</span>
          </>
        ) : (
          <>✨ 🚀 Crear Ahora</>
        )}
      </button>

      {imagenResultado && (
        <div className="mt-4 space-y-2 text-center">
          <p className="text-green-400 text-xs font-medium">✅ ¡Imagen generada con éxito!</p>
          <img src={imagenResultado} alt="Resultado IA" className="rounded-xl border border-amber-500/40 w-full object-cover shadow-md" />
        </div>
      )}

      <p className="text-[10px] text-gray-500 text-center leading-relaxed">
        Todo contenido se procesa en total privacidad y se elimina automáticamente. Tú eres responsable del contenido que generes.
      </p>

    </div>
  )
}
