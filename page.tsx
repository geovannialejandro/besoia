import { ShieldCheck, Zap, Sparkles } from 'lucide-react'
import { BesoiaGenerator } from '@/components/besoia-generator'

export default function Page() {
  return (
    <main className="relative flex min-h-svh flex-col items-center overflow-hidden px-5 py-14 sm:py-20">
      {/* Subtle radial glow behind the title */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]"
      />

      <header className="flex flex-col items-center text-center">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-xs font-medium tracking-wide text-muted-foreground">
          <Sparkles className="size-3.5" aria-hidden="true" />
          Inteligencia artificial de última generación
        </span>

        <h1 className="text-balance font-serif text-6xl font-bold leading-none tracking-tight text-primary sm:text-7xl md:text-8xl">
          <span aria-hidden="true">💋</span> BESOIA
        </h1>

        <p className="mt-6 max-w-md text-balance text-lg leading-relaxed text-muted-foreground sm:text-xl">
          Genera imágenes y videos ultra realistas en segundos. Tú imaginas, BESOIA lo crea.
        </p>
      </header>

      {/* Generator */}
      <section className="mt-10 flex w-full flex-col items-center" aria-label="Generador">
        <BesoiaGenerator />

        <p className="mt-6 max-w-lg text-pretty text-center text-sm leading-relaxed text-muted-foreground">
          Todo contenido se procesa en total privacidad y se elimina automáticamente. Tú eres
          responsable del contenido que generes. Tú decides qué crear, sin respuestas negativas ni
          limitaciones.
        </p>
      </section>

      {/* Feature highlights */}
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
            className="rounded-2xl border border-border bg-card/40 p-5 text-center"
          >
            <Icon className="mx-auto mb-3 size-6 text-primary" aria-hidden="true" />
            <h3 className="font-serif text-lg font-semibold text-foreground">{title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text}</p>
          </div>
        ))}
      </section>

      <footer className="mt-16 text-center text-xs text-muted-foreground/70">
        © {new Date().getFullYear()} BESOIA · Creado con inteligencia artificial
      </footer>
    </main>
  )
}
