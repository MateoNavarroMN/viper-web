import { useEffect, useState } from 'react'
import { get } from '../../../shared/api/client'

// Pide una página de los contratos de alquiler fijo, con el filtro de estado y la búsqueda.
// Devuelve { cargando, error, datos, reintentar }, donde `datos` es { total, totalPaginas, contratos }.
// Mientras llega una consulta nueva, `datos` conserva la lista anterior (para atenuarla en pantalla en vez de borrarla).
export function useAlquileresFijos({ q, estado, pagina }) {
  const clave = `${q}|${estado}|${pagina}`
  const [intento, setIntento] = useState(0)
  const [resultado, setResultado] = useState(null) // { clave, intento, datos, error }

  useEffect(() => {
    let vigente = true // si cambian los filtros antes de que responda, se ignora la respuesta vieja
    const consulta = new URLSearchParams({ pagina: String(pagina) })
    if (q) consulta.set('q', q)
    if (estado) consulta.set('estado', estado)
    get(`/reservas-fijas?${consulta}`)
      .then((datos) => vigente && setResultado({ clave, intento, datos }))
      .catch((e) => vigente && setResultado((previo) => ({ clave, intento, datos: previo?.datos ?? null, error: e.mensaje })))
    return () => {
      vigente = false
    }
  }, [clave, q, estado, pagina, intento])

  const alDia = resultado?.clave === clave && resultado.intento === intento
  return {
    cargando: !alDia,
    error: alDia ? resultado.error ?? null : null,
    datos: resultado?.datos ?? null,
    reintentar: () => setIntento((n) => n + 1),
  }
}

// Pide un contrato con todas sus fechas. Devuelve { cargando, error, noExiste, contrato, reintentar }.
export function useAlquilerFijo(id) {
  const [intento, setIntento] = useState(0)
  const [resultado, setResultado] = useState(null) // { id, intento, contrato, error, noExiste }

  useEffect(() => {
    let vigente = true
    get(`/reservas-fijas/${id}`)
      .then((contrato) => vigente && setResultado({ id, intento, contrato }))
      .catch((e) => vigente && setResultado({ id, intento, error: e.mensaje, noExiste: e.status === 404 }))
    return () => {
      vigente = false
    }
  }, [id, intento])

  const alDia = resultado?.id === id && resultado.intento === intento
  return {
    cargando: !alDia,
    error: alDia ? resultado.error ?? null : null,
    noExiste: alDia && Boolean(resultado.noExiste),
    contrato: alDia ? resultado.contrato ?? null : null,
    reintentar: () => setIntento((n) => n + 1),
  }
}