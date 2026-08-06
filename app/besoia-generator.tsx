async function generar() {
  setCargando(true)
  setError(null)
  setResultado(null)

  try {
    const form = new FormData()
    form.append('prompt', prompt)
    if (archivo) form.append('foto', archivo)

    const respuesta = await fetch(rutas[modo], {
      method: 'POST',
      body: form
    })

    const datos = await respuesta.json()
    if (!respuesta.ok) throw new Error(datos.error || 'Algo salió mal')

    setResultado(datos.imagen)
  } catch (err: any) {
    setError(err.message)
  } finally {
    setCargando(false)
  }
}

