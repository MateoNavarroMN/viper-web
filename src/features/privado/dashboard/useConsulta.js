import { useCallback, useEffect, useState } from 'react'
import { get } from '../../../shared/api/client'

// Pide un dato a la API cada vez que cambia la ruta. Es el hook de cada bloque del Dashboard: así un bloque que falla no afecta a
// los demás y cada uno puede reintentar por su cuenta.
// Con `ruta = null` no pide nada (por ejemplo, mientras un formulario tiene un rango inválido).
// Mantiene el último dato mientras carga uno nuevo o si el nuevo falla, y descarta las respuestas viejas.
// Devuelve { datos, cargando, error, reintentar }.
export function useConsulta(ruta) {
  const [intento, setIntento] = useState(0)
  // `clave` identifica el pedido al que corresponde lo guardado: si no es el pedido actual, todavía se está cargando
  const [guardado, setGuardado] = useState({ clave: null, datos: null, error: null })
  const clave = `${ruta}#${intento}`

  useEffect(() => {
    if (!ruta) return undefined
    let vigente = true
    get(ruta)
      .then((datos) => vigente && setGuardado({ clave, datos, error: null }))
      .catch((e) => vigente && setGuardado((anterior) => ({ ...anterior, clave, error: e.mensaje })))
    return () => {
      vigente = false
    }
  }, [ruta, clave])

  const reintentar = useCallback(() => setIntento((n) => n + 1), [])
  if (!ruta) return { datos: null, cargando: false, error: null, reintentar }
  const alDia = guardado.clave === clave
  return { datos: guardado.datos, cargando: !alDia, error: alDia ? guardado.error : null, reintentar }
}