import { useCallback, useEffect, useState } from 'react'
import { get } from '../../../shared/api/client'

// Pide el balance del Dashboard. `filtros` = { desde, hasta, rubro } (todo opcional: sin fechas la API devuelve el mes actual).
// Mantiene el último balance mientras carga uno nuevo o si el nuevo falla: así un error no borra lo que ya se estaba viendo.
// Devuelve { datos, cargando, error, reintentar }.
export function useBalance({ desde, hasta, rubro }) {
  const [intento, setIntento] = useState(0)
  // `clave` identifica el pedido al que corresponde lo guardado: si no es el pedido actual, todavía se está cargando
  const [guardado, setGuardado] = useState({ clave: null, datos: null, error: null })

  const parametros = new URLSearchParams()
  if (desde) parametros.set('desde', desde)
  if (hasta) parametros.set('hasta', hasta)
  if (rubro) parametros.set('rubro', rubro)
  const consulta = parametros.toString()
  const clave = `${consulta}#${intento}`

  useEffect(() => {
    let vigente = true
    get(`/dashboard/balance${consulta ? `?${consulta}` : ''}`)
      // Se descartan las respuestas viejas: si se cambió el filtro de nuevo, vale solo la última
      .then((datos) => vigente && setGuardado({ clave, datos, error: null }))
      .catch((e) => vigente && setGuardado((anterior) => ({ ...anterior, clave, error: e.mensaje })))
    return () => {
      vigente = false
    }
  }, [consulta, clave])

  const reintentar = useCallback(() => setIntento((n) => n + 1), [])
  const alDia = guardado.clave === clave
  return { datos: guardado.datos, cargando: !alDia, error: alDia ? guardado.error : null, reintentar }
}