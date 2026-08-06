    console.log('Enviando a Replicate:', input)

    const crear = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: 'lucataco/realvis-xl-v4:cf1669214b850d270608093c2a068b07292125c1',
        input: input
      })
    })

    const prediccion = await crear.json()
    console.log('Respuesta inicial:', prediccion)

    if (!crear.ok) throw new Error(prediccion.error || 'Error al generar')

    let estado = prediccion
    while (estado.status !== 'succeeded' && estado.status !== 'failed') {
      await new Promise(res => setTimeout(res, 2000))
      const revisar = await fetch(`https://api.replicate.com/v1/predictions/${estado.id}`, {
        headers: { 'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}` }
      })
      estado = await revisar.json()
      console.log('Estado actual:', estado.status)
    }

    if (estado.status === 'failed') {
      return NextResponse.json({ error: estado.error || 'No se pudo generar la imagen' }, { status: 500 })
    }

    return NextResponse.json({ imagen: estado.output?.[0] || estado.output })

  } catch (err) {
    console.error('Error completo:', err)
    return NextResponse.json({ error: (err as Error).message || 'Algo salió mal al procesar' }, { status: 500 })
  }
}

