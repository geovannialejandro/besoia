    (!model.needsDrivingVideo || !!drivingVideo)

  async function handleFile(
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (v: { name: string; dataUrl: string } | null) => void,
  ) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const dataUrl = await readFileAsDataUrl(file)
      setter({ name: file.name, dataUrl })
      setError(null)
    } catch {
      setError('No se pudo cargar el archivo. Intenta con otro.')
    }
  }

  async function handleGenerate() {
    if (!canSubmit) return
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelId,
          prompt,
          faceImage: faceImage?.dataUrl,
          drivingVideo: drivingVideo?.dataUrl,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'No se pudo generar el contenido.')
      setResult({ url: data.url, type: data.type })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-xl rounded-3xl border border-border bg-card/60 p-5 backdrop-blur sm:p-7">
      {/* Model selector */}
      <div
        role="radiogroup"
        aria-label="Modelo de generación"
        className="mb-5 grid grid-cols-1 gap-2"
      >
        {MODELS.map((m) => {
          const active = m.id === modelId
          return (
            <button
              key={m.id}
              role="radio"
              aria-checked={active}
              onClick={() => {
                setModelId(m.id)
                setResult(null)
                setError(null)
              }}
              className={`flex flex-col items-start rounded-2xl border px-4 py-3 text-left transition-colors ${
                active
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-secondary/40 hover:bg-secondary'
              }`}
            >
              <span
                className={`text-sm font-semibold ${
                  active ? 'text-primary' : 'text-foreground'
                }`}
              >
                {m.name}
              </span>
              <span className="mt-0.5 text-xs text-muted-foreground">{m.description}</span>
            </button>
          )
        })}
      </div>

      {/* Prompt */}
      {model.needsPrompt && (
        <div className="mb-4">
          <label htmlFor="prompt" className="mb-2 block text-sm text-muted-foreground">
            Describe lo que quieres crear
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (
                e.key === 'Enter' &&
                (e.metaKey || e.ctrlKey) &&
                !e.nativeEvent.isComposing &&
                e.keyCode !== 229
              ) {
                e.preventDefault()
                handleGenerate()
              }
            }}
            rows={3}
            maxLength={1000}
            placeholder={model.promptPlaceholder}
            className="w-full resize-none rounded-2xl border border-border bg-input/40 px-4 py-3 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/70 focus:ring-2 focus:ring-ring"
          />
        </div>
      )}

      {/* Face image upload */}
      {model.needsFaceImage && (
        <FileField
          label="Foto de rostro de referencia"
          accept="image/*"
          inputRef={faceInputRef}
          value={faceImage}
          onChange={(e) => handleFile(e, setFaceImage)}
          onClear={() => setFaceImage(null)}
          preview="image"
        />
      )}

      {/* Driving video upload */}
      {model.needsDrivingVideo && (
        <FileField
          label="Video guía de referencia"
          accept="video/*"
          inputRef={videoInputRef}
          value={drivingVideo}
          onChange={(e) => handleFile(e, setDrivingVideo)}
          onClear={() => setDrivingVideo(null)}
          preview="video"
        />
      )}

      <Button
        onClick={handleGenerate}
        disabled={!canSubmit}
        className="mt-4 h-14 w-full rounded-2xl text-lg font-semibold shadow-lg shadow-primary/20"
      >
        {loading ? (
          <>
            <Loader2 className="size-5 animate-spin" aria-hidden="true" />
            Generando...
          </>
        ) : (
          <>
            <Sparkles className="size-5" aria-hidden="true" />
            Generar Ahora
          </>
        )}
      </Button>

      {error && (
        <p role="alert" className="mt-4 text-center text-sm text-destructive">
          {error}
        </p>
      )}

      {loading && (
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {model.mediaType === 'video'
            ? 'Los videos pueden tardar 1-2 minutos. No cierres esta ventana.'
            : 'Creando tu imagen, esto toma unos segundos...'}
        </p>
      )}

      {result && (
        <div className="mt-6">
          <div className="overflow-hidden rounded-2xl border border-border bg-black">
            {result.type === 'video' ? (
              <video src={result.url} controls autoPlay loop playsInline className="w-full" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={result.url || '/placeholder.svg'}
                alt="Contenido generado con BESOIA"
                className="w-full"
              />
            )}
          </div>
          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="mt-3 flex items-center justify-center gap-2 rounded-2xl border border-border px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <Download className="size-4" aria-hidden="true" />
            Descargar resultado
          </a>
        </div>
      )}
    </div>
  )
}

function FileField({
  label,
  accept,
  inputRef,
  value,
  onChange,
  onClear,
  preview,
}: {
  label: string
  accept: string
  inputRef: React.RefObject<HTMLInputElement | null>
  value: { name: string; dataUrl: string } | null
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onClear: () => void
  preview: 'image' | 'video'
}) {
  return (
    <div className="mb-4">
      <span className="mb-2 block text-sm text-muted-foreground">{label}</span>
      <input ref={inputRef} type="file" accept={accept} onChange={onChange} className="sr-only" />
      {value ? (
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-input/40 p-3">
          <div className="size-14 shrink-0 overflow-hidden rounded-xl border border-border bg-black">
            {preview === 'image' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={value.dataUrl || '/placeholder.svg'} alt="" className="size-full object-cover" />
            ) : (
              <video src={value.dataUrl} className="size-full object-cover" muted />
            )}
          </div>
          <span className="min-w-0 flex-1 truncate text-sm text-foreground">{value.name}</span>
          <button
            type="button"
            onClick={onClear}
            aria-label="Quitar archivo"
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-input/20 px-4 py-4 text-sm text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
        >
          <Upload className="size-4" aria-hidden="true" />
          Subir archivo
        </button>
      )}
    </div>
  )
      } 
