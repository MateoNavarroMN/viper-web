import { marcadorVacio } from './marcador'

// Lógica de lo que pasa después de cargar un resultado (CU 3.6 · pasos 9 a 12) y de corregirlo (6a). Todo son funciones
// puras: la API (M3-BE-18 y M3-BE-19) es la que decide de verdad; esto solo adelanta el motivo para mostrarlo.

// Por qué no se puede corregir el resultado de un partido (null si se puede). Son las mismas reglas que valida la API en
// `PUT /partidos/:id/resultado`. `cuadro` es { zonas, rondas } de GET /torneos/:id/cuadro y `torneo`, el de la ficha.
export const motivoSinCorreccion = (partido, cuadro, torneo) => {
  if (partido.esBye) return 'Es un partido libre (bye).'
  if (partido.estado === 'WO') return 'El partido terminó por W.O.'
  if (partido.estado !== 'FINALIZADO') return 'El partido todavía no tiene resultado.'

  // Un torneo finalizado solo admite corregir la final: el campeón puede cambiar, pero el torneo sigue finalizado
  const esFinal = partido.instancia === 'FINAL' && !partido.siguiente
  if (torneo.estado === 'FINALIZADO' && !esFinal) return 'El torneo ya finalizó: solo se puede corregir la final.'
  if (torneo.estado !== 'EN_CURSO' && torneo.estado !== 'FINALIZADO') return 'El torneo no está en curso.'

  if (!partido.instancia) {
    if (cuadro.rondas.length > 0) return 'Ya se generó la fase eliminatoria.'
  } else if (partido.siguiente) {
    const siguiente = cuadro.rondas.flatMap((r) => r.partidos).find((p) => p.id === partido.siguiente.partidoId)
    if (siguiente && (siguiente.estado === 'FINALIZADO' || siguiente.estado === 'WO')) return 'El ganador ya jugó su partido siguiente.'
  }
  return null
}

// Los sets de un partido ya jugado como las casillas de la pantalla del marcador: [{ local: '6', visitante: '3' }, ...]
export const valoresDeSets = (sets = []) =>
  marcadorVacio().map((vacio, i) => (sets[i] ? { local: String(sets[i].local), visitante: String(sets[i].visitante) } : vacio))

// '6-3 6-4'
export const textoDeSets = (sets) => sets.map((s) => `${s.local}-${s.visitante}`).join(' ')

// Sets ganados por cada lado: { local, visitante }
export const setsGanadosDe = (sets) => ({
  local: sets.filter((s) => s.local > s.visitante).length,
  visitante: sets.filter((s) => s.visitante > s.local).length,
})

// Por qué se dieron puntos (`instancia` de cada puntaje de la respuesta de la API)
export const ETIQUETA_PUNTOS = {
  VICTORIA_EN_ZONA: 'Victoria en zona',
  CLASIFICADO_DE_ZONA: 'Clasificado de zona',
  PARTICIPACION: 'Participación (partido perdido)',
  CAMPEON: 'Campeón',
  FINAL: 'Victoria en la final',
  SEMIFINAL: 'Victoria en semifinal',
  CUARTOS: 'Victoria en cuartos de final',
  OCTAVOS: 'Victoria en octavos de final',
  DIECISEISAVOS: 'Victoria en dieciseisavos de final',
  TREINTAIDOSAVOS: 'Victoria en treintaidosavos de final',
  SESENTAYCUATROAVOS: 'Victoria en sesentaicuatroavos de final',
}

// 'M. Pérez'
export const nombreJugador = (jugador) => `${jugador.nombre.charAt(0)}. ${jugador.apellido}`

// Los puntos otorgados agrupados por motivo, en el orden en que aparecen: [{ instancia, etiqueta, filas: [{ jugador, puntos, puntosTotales }] }]
export const agruparPuntos = (puntosOtorgados) => {
  const grupos = new Map()
  for (const p of puntosOtorgados) {
    if (!grupos.has(p.instancia)) grupos.set(p.instancia, { instancia: p.instancia, etiqueta: ETIQUETA_PUNTOS[p.instancia] ?? p.instancia, filas: [] })
    grupos.get(p.instancia).filas.push(p)
  }
  return [...grupos.values()]
}

const PUESTOS_VISIBLES = 5

// Las filas del ranking que se muestran: los primeros puestos y, aparte, los jugadores del partido que quedaron más abajo.
// `antes` y `despues` son `ranking` de GET /ranking/:disciplina (antes puede ser null si no se pudo pedir). Cada fila trae:
//   cambio:    puestos que subió (positivo), bajó (negativo) o 0; null si no estaba en el ranking
//   categoria: la de ahora, y `categoriaAnterior` si cambió
export const filasDeRanking = (antes, despues, jugadorIds) => {
  const involucrados = new Set(jugadorIds)
  const previas = new Map((antes ?? []).map((r) => [r.jugador.id, r]))
  const fila = (r) => {
    const previa = previas.get(r.jugador.id)
    return {
      ...r,
      involucrado: involucrados.has(r.jugador.id),
      cambio: previa ? previa.posicion - r.posicion : null,
      categoriaAnterior: previa && previa.categoria.id !== r.categoria.id ? previa.categoria.nombre : null,
    }
  }
  const arriba = despues.slice(0, PUESTOS_VISIBLES).map(fila)
  const abajo = despues.slice(PUESTOS_VISIBLES).filter((r) => involucrados.has(r.jugador.id)).map(fila)
  return { arriba, abajo }
}