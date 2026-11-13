import { useEffect, useRef, useState } from 'react'
import { get } from '../../../shared/api/client'
import { REFRESCO_MS, disciplinasDe } from './reservas'

// Pide la grilla de un día (y de un deporte, o de los dos) y la mantiene al día: se vuelve a pedir cada 30 segundos y al
// volver a la pestaña del navegador. Los refrescos son en silencio: la grilla no parpadea con un «Cargando».
// Devuelve { cargando, error, datos, actualizadaEn, desactualizada, reintentar, refrescar }, donde `datos` es { fechaPasada, canchas }.
// `refrescar()` vuelve a pedir la grilla ya mismo y en silencio (por ejemplo, al elegir un turno, para confirmar que sigue libre).
// Si un refresco falla pero ya hay datos, se conservan y `desactualizada` avisa que pueden no ser los últimos.
export function useGrilla(fecha, deporte) {
  const clave = `${fecha}|${deporte}`
  const [estado, setEstado] = useState({ clave: null })
  const [intento, setIntento] = useState(0)
  const cargarAhora = useRef(null)

  useEffect(() => {
    let vigente = true
    const cargar = async () => {
      try {
        const respuestas = await Promise.all(disciplinasDe(deporte).map((d) => get(`/canchas/disponibilidad?disciplina=${d}&fecha=${fecha}`)))
        if (!vigente) return
        const datos = { fechaPasada: respuestas[0].fechaPasada, canchas: respuestas.flatMap((r) => r.canchas) }
        setEstado({ clave, datos, actualizadaEn: new Date() })
      } catch (e) {
        if (!vigente) return
        setEstado((previo) => (previo.clave === clave && previo.datos ? { ...previo, desactualizada: true } : { clave, error: e.mensaje }))
      }
    }
    cargarAhora.current = cargar
    cargar()
    const cada = setInterval(cargar, REFRESCO_MS)
    const alVolver = () => document.visibilityState === 'visible' && cargar()
    document.addEventListener('visibilitychange', alVolver)
    return () => {
      vigente = false
      clearInterval(cada)
      document.removeEventListener('visibilitychange', alVolver)
    }
  }, [clave, fecha, deporte, intento])

  const actual = estado.clave === clave ? estado : null
  return {
    cargando: !actual,
    error: actual?.error ?? null,
    datos: actual?.datos ?? null,
    actualizadaEn: actual?.actualizadaEn ?? null,
    desactualizada: Boolean(actual?.desactualizada),
    refrescar: () => cargarAhora.current?.(),
    reintentar: () => {
      setEstado({ clave: null })
      setIntento((n) => n + 1)
    },
  }
}

