import { aMinutos } from './programacion'

// Lógica del cronograma de partidos de un torneo (CU 3.4 · paso 7): qué partidos son de un jugador y cómo se agrupan por día.

// Un partido es del jugador si juega en alguno de los dos lados (titular o compañero). `jugadorId` es `usuario.jugador_id`.
export const esDelJugador = (partido, jugadorId) =>
  Boolean(jugadorId) && [partido.local, partido.visitante].some((p) => p && [p.titular, p.companero].some((j) => j?.id === jugadorId))

// Orden dentro de un día: por hora de inicio y, a igual hora, por cancha
const porHora = (a, b) =>
  aMinutos(a.programacion.horaInicio) - aMinutos(b.programacion.horaInicio) || a.programacion.cancha.nombre.localeCompare(b.programacion.cancha.nombre)

// Reparte los partidos (sin byes) en los días con partidos, de más cercano a más lejano, y en los que todavía no tienen franja.
// Devuelve { dias: [{ fecha, partidos }], sinProgramar: [partido] }.
export const agruparPorDia = (partidos) => {
  const porFecha = new Map()
  const sinProgramar = []
  for (const partido of partidos) {
    if (!partido.programacion) {
      sinProgramar.push(partido)
      continue
    }
    const { fecha } = partido.programacion
    if (!porFecha.has(fecha)) porFecha.set(fecha, [])
    porFecha.get(fecha).push(partido)
  }
  const dias = [...porFecha.keys()].sort().map((fecha) => ({ fecha, partidos: porFecha.get(fecha).sort(porHora) }))
  return { dias, sinProgramar }
}

// Hoy como 'AAAA-MM-DD' en la hora del navegador, para marcar el día con «Hoy»
export const hoy = () => {
  const ahora = new Date()
  return `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`
}