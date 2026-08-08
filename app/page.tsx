import { ShieldCheck, Zap, Sparkles } from 'lucide-react'
import BesoiaGenerator from './besoia-generator'

export default function Page() {
  return (
    <main className="relative flex min-h-svh flex-col items-center overflow-hidden px-5 py-14 sm:py-20 bg-gray-950 text-white">
      {/* Brillo suave detrás del título */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-amber-500/10 blur-[120px]"
      />

      <header className="flex flex-col items-center text-center">
        <div className="mt-10 mb-6">
          <img
            src="https://picsum.photos/900/500"
            alt="Ejemplo BESOIA"
            className="rounded-2xl shadow-lg border border-amber-500/20 max-w-sm w-full object-cover"
          />
        </div>
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-medium tracking-wide text-amber-300">
          <Sparkles className="w-4 h-4" aria-hidden="true" />
          Inteligencia artificial de última generación
        </span>

        {/* Título con el besito */}
        <h1 className="text-balance font-serif text-6xl font-bold leading-none tracking-tight text-amber-400 sm:text-7xl md:text-8xl flex items-center gap-3">
          <span aria-hidden="true" className="text-7xl">💋</span>
          BESOIA
        </h1>

        <p className="mt-6 max-w-md text-balance text-lg leading-relaxed text-gray-300 sm:text-xl">
          Genera imágenes y videos ultra realistas en segundos. Tú imaginas, BESOIA lo crea.
        </p>
      </header>

      {/* Generador */}
      <section className="mt-10 flex w-full flex-col items-center" aria-label="Generador">
        <BesoiaGenerator />

        <p className="mt-6 max-w-lg text-pretty text-center text-sm leading-relaxed text-gray-400">
          Todo contenido se procesa en total privacidad y se elimina automáticamente. Tú eres
          responsable del contenido que generes. Tú decides qué crear, sin respuestas negativas ni
          limitaciones.
        </p>
      </section>

      {/* Características */}
      <section className="mt-14 grid w-full max-w-xl grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            icon: Zap,
            title: 'Ultra rápido',
            text: 'Resultados en segundos con modelos de alta fidelidad.',
          },
          {
            icon: ShieldCheck,
            title: 'Privacidad total',
            text: 'Tu contenido se procesa y elimina automáticamente.',
          },
          {
            icon: Sparkles,
            title: 'Sin límites',
            text: 'Imágenes y videos realistas, tú decides qué crear.',
          },
        ].map(({ icon: Icon, title, text }) => (
          <div
            key={title}
            className="rounded-2xl border border-amber-600/30 bg-gray-900/50 p-5 text-center shadow-lg"
          >
            <Icon className="mx-auto mb-3 w-6 h-6 text-amber-400" aria-hidden="true" />
            <h3 className="font-serif text-lg font-semibold text-white">{title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-gray-400">{text}</p>
          </div>
        ))}
      </section>

      <footer className="mt-16 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} BESOIA · Creado con inteligencia artificial
      </footer>
    </main>
  )
}
