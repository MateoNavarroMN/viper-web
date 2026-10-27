import { ESTADOS } from '../../../shared/utils/estados'
import { textoDeSets } from './resultado'
import { ETIQUETA_INSTANCIA, nombreCorto } from './torneos'

// Lógica de la pantalla «Archivar torneo» (CU 3.8). Son funciones puras sobre lo que devuelve GET /torneos/:id/resumen.

// Los estados que se listan en el aviso de 5a, en el orden del Figma; solo el Finalizado se puede archivar
const ESTADOS_DEL_AVISO = ['PLANIFICADO', 'INSCRIPCIONES_ABIERTAS', 'INSCRIPCIONES_CERRADAS', 'EN_CURSO', 'CANCELADO', 'FINALIZADO']

// [{ estado, texto, permitido }] para «Según el estado del torneo»
export const estadosParaArchivar = () =>
  ESTADOS_DEL_AVISO.map((estado) => ({ estado, texto: ESTADOS.torneo[estado].texto, permitido: estado === 'FINALIZADO' }))

// 'Estado actual: En curso.'
export const textoEstadoActual = (estado) => `Estado actual: ${ESTADOS.torneo[estado]?.texto ?? estado}.`

// Cómo terminó la final: '6-4 6-3', 'W.O.' o null si no se jugó
const resultadoDe = (partido) => {
  if (partido.estado === 'WO') return 'W.O.'
  return partido.sets?.length > 0 ? textoDeSets(partido.sets) : null
}

// Campeón, finalista y resultado de la final para la tarjeta «Cuadro final».
// `campeon` y `finalista` son null si el torneo terminó sin final jugada (doble baja).
export const cuadroFinalDe = (resumen) => {
  const final = resumen.resultados.find((r) => r.instancia === 'FINAL')
  return { campeon: resumen.campeon, finalista: resumen.finalista, resultadoFinal: final ? resultadoDe(final) : null }
}

// Dónde se jugó un partido: 'Final', 'Semifinales' o 'Zona A · Fecha 2'
export const lugarDe = (partido) =>
  partido.fase === 'ZONA' ? `${partido.zona} · Fecha ${partido.ronda}` : (ETIQUETA_INSTANCIA[partido.instancia] ?? `Ronda ${partido.ronda}`)

// Una fila de «Resultados»: { id, lugar, local, visitante, ganador: 'local' | 'visitante' | null, texto }
export const filaDeResultado = (partido) => {
  const ganador = partido.ganadorInscripcionId === partido.local?.inscripcionId
    ? 'local'
    : partido.ganadorInscripcionId === partido.visitante?.inscripcionId ? 'visitante' : null
  let texto = resultadoDe(partido) ?? ''
  if (partido.estado === 'WO') texto = partido.wo?.ausente === 'AMBOS' ? 'W.O. · baja de los dos' : 'W.O.'
  return {
    id: partido.partidoId,
    lugar: lugarDe(partido),
    local: nombreCorto(partido.local),
    visitante: nombreCorto(partido.visitante),
    ganador,
    texto,
  }
}

// Los resultados agrupados por lugar, en el orden en que llegan: [{ lugar, filas }]
export const resultadosPorLugar = (resultados) => {
  const grupos = new Map()
  for (const partido of resultados) {
    const fila = filaDeResultado(partido)
    const clave = partido.fase === 'ZONA' ? partido.zona : (ETIQUETA_INSTANCIA[partido.instancia] ?? `Ronda ${partido.ronda}`)
    if (!grupos.has(clave)) grupos.set(clave, { lugar: clave, filas: [] })
    grupos.get(clave).filas.push(fila)
  }
  return [...grupos.values()]
}

// «+100 pts» o «-20 pts»
export const puntosConSigno = (puntos) => `${puntos > 0 ? '+' : ''}${puntos} pts`