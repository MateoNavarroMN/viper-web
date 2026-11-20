import { useEffect, useState } from 'react'
import { get } from '../../../shared/api/client'

// La cuota del Jugador que se quiere pagar (de GET /mis-cuotas). Devuelve { cargando, error, noExiste, cuota, reintentar }.
// `noExiste` es true si la cuota no figura entre las del jugador (o si no es socio).
export function useCuotaAPagar(id) {
  const [estado, setEstado] = useState({ id: null })
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let vigente = true
    get('/mis-cuotas')
      .then((r) => {
        const cuota = (r.cuotas ?? []).find((c) => c.id === id)
        if (vigente) setEstado(cuota ? { id, cuota } : { id, noExiste: true })
      })
      .catch((e) => vigente && setEstado(e.status === 404 || e.status === 403 ? { id, noExiste: true } : { id, error: e.mensaje }))
    return () => {
      vigente = false
    }
  }, [id, intento])

  const actual = estado.id === id ? estado : null
  return {
    cargando: !actual,
    error: actual?.error ?? null,
    noExiste: Boolean(actual?.noExiste),
    cuota: actual?.cuota ?? null,
    reintentar: () => {
      setEstado({ id: null })
      setIntento((n) => n + 1)
    },
  }
}