import { nombreCorto } from './torneos'

// Lógica de la grilla de «Programar partido» (CU 3.5). Todo en minutos desde la medianoche.
// La API (M3-BE-13) valida lo mismo al reservar; esto solo decide qué franjas se ofrecen y cómo se dibujan.

// Un partido dura 90 minutos y se puede empezar cada 30 (lo mismo que el scheduler de la API)
export const DURACION = 90
export const PASO = 30

export const aMinutos = (hhmm) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5))
export const aHora = (minutos) => `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`

const chocan = (a, b) => a.ini < b.fin && b.ini < a.fin

// Cada hora de inicio posible de un día, dentro del horario del club: [480, 510, ..., 1350]
export const horasDelDia = (horario) => {
  const horas = []
  for (let m = aMinutos(horario.desde); m < aMinutos(horario.hasta); m += PASO) horas.push(m)
  return horas
}

// Todos los partidos del cuadro (zonas y eliminatoria), cada uno con `lugar`: la zona o la instancia
export const partidosDelCuadro = (cuadro, etiquetaInstancia) => [
  ...cuadro.zonas.flatMap((zona) => zona.partidos.map((p) => ({ ...p, lugar: zona.nombre }))),
  ...cuadro.rondas.flatMap((ronda) => ronda.partidos.map((p) => ({ ...p, lugar: etiquetaInstancia[p.instancia] ?? p.instancia }))),
]

// «A. Pérez vs L. Ríos»
export const rivalesDe = (partido) => `${nombreCorto(partido.local)} vs ${nombreCorto(partido.visitante)}`

// Los otros partidos de este torneo que juegan los mismos participantes ese día: [{ ini, fin, etiqueta }]
export const ocupacionesDeParticipantes = (partido, partidos, fecha) => {
  const ids = new Set([partido.local?.inscripcionId, partido.visitante?.inscripcionId].filter(Boolean))
  return partidos
    .filter((p) => p.id !== partido.id && p.programacion?.fecha === fecha && ['PENDIENTE', 'PROGRAMADO'].includes(p.estado))
    .filter((p) => ids.has(p.local?.inscripcionId) || ids.has(p.visitante?.inscripcionId))
    .map((p) => ({ ini: aMinutos(p.programacion.horaInicio), fin: aMinutos(p.programacion.horaFin), etiqueta: rivalesDe(p) }))
}

const TIPOS = { OCASIONAL: 'alquiler', FIJA: 'fija', TORNEO: 'torneo' }

// Cómo se ve una franja de 30 minutos de una cancha, un día.
//   dia:        la respuesta de GET /canchas/disponibilidad de ese día
//   canchaId:   la cancha que se mira
//   partido:    el partido que se programa (su reserva actual no cuenta como ocupada)
//   etiquetas:  { [partidoId]: 'A vs B' } de los partidos del torneo, para rotular las reservas de torneo
//   seleccion:  { canchaId, fecha, horaInicio } o null
//   enPeriodo:  false si el día queda fuera del período del torneo
// Devuelve { tipo, texto?, detalle? } con tipo: 'libre' | 'noentra' | 'alquiler' | 'fija' | 'torneo' | 'actual' |
// 'participante' | 'seleccionada'. `texto` va solo en la primera franja de cada reserva.
export const franja = ({ minutos, fecha, dia, canchaId, partido, etiquetas, participantes, seleccion, enPeriodo }) => {
  const celda = { ini: minutos, fin: minutos + PASO }
  const horario = { desde: aMinutos(dia.horario.desde), hasta: aMinutos(dia.horario.hasta) }
  const empieza = (o) => (o.ini >= celda.ini && o.ini < celda.fin) || (minutos === horario.desde && o.ini < celda.ini)

  if (seleccion && seleccion.fecha === fecha && seleccion.canchaId === canchaId) {
    const ini = aMinutos(seleccion.horaInicio)
    if (chocan(celda, { ini, fin: ini + DURACION })) return { tipo: 'seleccionada', texto: empieza({ ini }) ? 'Seleccionada' : null }
  }

  const cancha = dia.canchas.find((c) => c.id === canchaId)
  const ocupadas = (cancha?.ocupadas ?? []).map((o) => ({ ...o, ini: aMinutos(o.horaInicio), fin: aMinutos(o.horaFin) }))
  const propia = ocupadas.find((o) => o.partidoId === partido.id)
  const ajenas = ocupadas.filter((o) => o.partidoId !== partido.id)

  const ocupada = ajenas.find((o) => chocan(celda, o))
  if (ocupada) {
    const tipo = TIPOS[ocupada.tipo] ?? 'alquiler'
    const texto = { alquiler: 'Alquiler', fija: 'Reserva fija', torneo: 'Torneo' }[tipo]
    return { tipo, texto: empieza(ocupada) ? texto : null, detalle: empieza(ocupada) && tipo === 'torneo' ? (etiquetas[ocupada.partidoId] ?? ocupada.torneo) : null }
  }
  const ocupado = participantes.find((o) => chocan(celda, o))
  if (ocupado) return { tipo: 'participante', texto: empieza(ocupado) ? 'Participante ocupado' : null, detalle: empieza(ocupado) ? ocupado.etiqueta : null }
  if (propia && chocan(celda, propia)) return { tipo: 'actual', texto: empieza(propia) ? 'Horario actual' : null }

  // Libre solo si el partido entero entra desde acá: dentro del horario, del período y sin pisar nada
  const entero = { ini: minutos, fin: minutos + DURACION }
  const entra = enPeriodo && entero.ini >= horario.desde && entero.fin <= horario.hasta
    && !ajenas.some((o) => chocan(entero, o)) && !participantes.some((o) => chocan(entero, o))
  return { tipo: entra ? 'libre' : 'noentra', texto: null }
}