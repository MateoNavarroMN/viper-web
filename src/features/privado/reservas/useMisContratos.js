import { useCallback, useEffect, useState } from 'react'
import { get } from '../../../shared/api/client'

// Pide los alquileres fijos vigentes del Jugador (con el aviso de fin de contrato y su respuesta).
// Devuelve { contratos, refrescar }: `contratos` es [] mientras carga o si no se pudo pedir (el aviso es un extra: si falla, no se muestra).
// `refrescar()` los vuelve a pedir en silencio, por ejemplo después de responder.
export function useMisContratos() {
  const [contratos, setContratos] = useState([])
  const [refresco, setRefresco] = useState(0)

  useEffect(() => {
    let vigente = true
    get('/mis-contratos')
      .then((datos) => vigente && setContratos(datos.contratos))
      .catch(() => vigente && setContratos([]))
    return () => {
      vigente = false
    }
  }, [refresco])

  return { contratos, refrescar: useCallback(() => setRefresco((n) => n + 1), []) }
}