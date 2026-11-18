import { useCallback, useEffect, useState } from 'react'
import { get } from '../../../shared/api/client'

// Todas las canchas con sus reservas futuras. `recargar` vuelve a pedirlas sin tapar la lista con el spinner.
export function useCanchas() {
  const [estado, setEstado] = useState({ cargando: true, canchas: [], error: null })
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let vigente = true
    get('/canchas')
      .then((r) => vigente && setEstado({ cargando: false, canchas: r.canchas, error: null }))
      .catch((e) => vigente && setEstado((previo) => ({ ...previo, cargando: false, error: e.mensaje })))
    return () => {
      vigente = false
    }
  }, [intento])

  const reintentar = useCallback(() => {
    setEstado((previo) => ({ ...previo, cargando: true, error: null }))
    setIntento((n) => n + 1)
  }, [])
  const recargar = useCallback(() => setIntento((n) => n + 1), [])

  return { ...estado, reintentar, recargar }
}