import { useEffect, useState } from 'react'
import { get } from '../../../shared/api/client'

// Lo que hace falta para pagar una inscripción: la inscripción del Jugador (GET /mis-inscripciones) y su torneo (GET /torneos/:id),
// que trae el importe. Devuelve { cargando, error, noExiste, inscripcion, torneo, reintentar }.
// `noExiste` es true si la inscripción no figura entre las del jugador o si su torneo ya no se puede consultar.
export function useInscripcionAPagar(id) {
  const [estado, setEstado] = useState({ id: null })
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let vigente = true
    get('/mis-inscripciones')
      .then(async ({ inscripciones }) => {
        const inscripcion = inscripciones.find((i) => i.id === id)
        if (!inscripcion) {
          if (vigente) setEstado({ id, noExiste: true })
          return
        }
        const { torneo } = await get(`/torneos/${inscripcion.torneo.id}`)
        if (vigente) setEstado({ id, inscripcion, torneo })
      })
      .catch((e) => vigente && setEstado(e.status === 404 ? { id, noExiste: true } : { id, error: e.mensaje }))
    return () => {
      vigente = false
    }
  }, [id, intento])

  const actual = estado.id === id ? estado : null
  return {
    cargando: !actual,
    error: actual?.error ?? null,
    noExiste: Boolean(actual?.noExiste),
    inscripcion: actual?.inscripcion ?? null,
    torneo: actual?.torneo ?? null,
    reintentar: () => {
      setEstado({ id: null })
      setIntento((n) => n + 1)
    },
  }
}