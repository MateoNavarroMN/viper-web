import { useEffect, useState } from 'react'
import { get } from '../../../shared/api/client'

// Pide el detalle de una reserva (GET /reservas/:id). Devuelve { cargando, error, reserva, noExiste, reintentar }.
// `noExiste` es true si la API responde 404: la reserva se canceló o se borró mientras se miraba la grilla.
export function useReserva(id) {
  const [estado, setEstado] = useState({ id: null })
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let vigente = true
    get(`/reservas/${id}`)
      .then((reserva) => vigente && setEstado({ id, reserva }))
      .catch((e) => vigente && setEstado({ id, error: e.mensaje, noExiste: e.status === 404 }))
    return () => {
      vigente = false
    }
  }, [id, intento])

  const actual = estado.id === id ? estado : null
  return {
    cargando: !actual,
    error: actual?.error ?? null,
    noExiste: Boolean(actual?.noExiste),
    reserva: actual?.reserva ?? null,
    reintentar: () => {
      setEstado({ id: null })
      setIntento((n) => n + 1)
    },
  }
}
