import { useCallback, useEffect, useState } from 'react'
import { get } from '../../../shared/api/client'

// Pide una página de las reservas del Jugador: vista 'proximas' o 'historial'.
// Devuelve { cargando, error, datos, reintentar, refrescar }, donde `datos` es { total, totalPaginas, reservas }.
// `refrescar()` vuelve a pedir la lista en silencio (sin el «Cargando»): se usa cuando una reserva pendiente llega a su
// vencimiento, para que la API la devuelva ya como Expirada.
export function useMisReservas(vista, pagina) {
  const clave = `${vista}|${pagina}`
  const [estado, setEstado] = useState({ clave: null })
  const [intento, setIntento] = useState(0)
  const [refresco, setRefresco] = useState(0)

  useEffect(() => {
    let vigente = true
    get(`/mis-reservas?vista=${vista}&pagina=${pagina}`)
      .then((datos) => vigente && setEstado({ clave, datos }))
      .catch((e) => vigente && setEstado((previo) => (previo.clave === clave && previo.datos ? previo : { clave, error: e.mensaje })))
    return () => {
      vigente = false
    }
  }, [clave, vista, pagina, intento, refresco])

  const actual = estado.clave === clave ? estado : null
  return {
    cargando: !actual,
    error: actual?.error ?? null,
    datos: actual?.datos ?? null,
    refrescar: useCallback(() => setRefresco((n) => n + 1), []),
    reintentar: () => {
      setEstado({ clave: null })
      setIntento((n) => n + 1)
    },
  }
}