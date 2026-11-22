import { useCallback, useEffect, useState } from 'react'
import { get } from '../../../shared/api/client'

// Pide un bloque del portal (cada uno tiene su propio endpoint, así que un error en uno no afecta a los demás).
// Devuelve { cargando, datos, error, reintentar }.
export function usePortal(ruta) {
  const [estado, setEstado] = useState({ cargando: true, datos: null, error: null })
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let vigente = true
    get(ruta)
      .then((datos) => vigente && setEstado({ cargando: false, datos, error: null }))
      .catch((e) => vigente && setEstado({ cargando: false, datos: null, error: e.mensaje }))
    return () => {
      vigente = false
    }
  }, [ruta, intento])

  const reintentar = useCallback(() => {
    setEstado({ cargando: true, datos: null, error: null })
    setIntento((n) => n + 1)
  }, [])

  return { ...estado, reintentar }
}