import { ETIQUETA_INSTANCIA, nombreCorto } from './torneos'

// Lógica de «Registrar baja / W.O.» (CU 3.7). Son funciones puras: la API (M3-BE-20) es la que decide de verdad; esto solo
// adelanta el resultado para mostrarlo antes de confirmar.

export const MAX_DETALLE = 200

// Cómo se nombra a quien juega según la disciplina: una pareja en Pádel, un jugador en Tenis
export const QUIENES = {
  PADEL: { quien: 'Pareja que causa la baja', ambos: 'Ambas parejas', ayuda: 'Podés marcar a ambas parejas si las dos causan baja.' },
  TENIS: { quien: 'Jugador que causa la baja', ambos: 'Ambos jugadores', ayuda: 'Podés marcar a ambos jugadores si los dos causan baja.' },
}

// Motivos que acepta la API (`motivo` de POST /partidos/:id/wo)
export const MOTIVOS_WO = [
  { valor: 'INASISTENCIA', texto: 'Inasistencia' },
  { valor: 'BAJA', texto: 'Baja' },
  { valor: 'RETIRO', texto: 'Retiro' },
  { valor: 'DESCALIFICACION', texto: 'Descalificación' },
]

// Cómo se muestra cada motivo (`wo.motivo` del cuadro). AVANCE_POR_BAJA lo pone el sistema, no una persona.
export const ETIQUETA_MOTIVO_WO = {
  ...Object.fromEntries(MOTIVOS_WO.map((m) => [m.valor, m.texto])),
  AVANCE_POR_BAJA: 'Avance por baja del rival',
}

// Por qué un partido no admite registrar una baja (null si admite). Mismas reglas que valida la API en `POST /partidos/:id/wo`.
export const motivoSinWO = (partido, torneo) => {
  if (partido.esBye) return 'Es un partido libre (bye).'
  if (partido.estado === 'FINALIZADO' || partido.estado === 'WO') return 'El partido ya está resuelto.'
  if (!partido.local || !partido.visitante) return 'Todavía no están definidos los dos rivales.'
  if (torneo.estado !== 'EN_CURSO') return 'El torneo no está en curso.'
  return null
}

// Los lados marcados ({ LOCAL: true, VISITANTE: false }) → 'LOCAL' | 'VISITANTE' | 'AMBOS' | null (nadie marcado)
export const ausenteDe = (marcados) => {
  if (marcados.LOCAL && marcados.VISITANTE) return 'AMBOS'
  if (marcados.LOCAL) return 'LOCAL'
  if (marcados.VISITANTE) return 'VISITANTE'
  return null
}

// Quién gana por W.O.: el que no faltó ('LOCAL' | 'VISITANTE'), o null si no falta nadie marcado o faltan los dos
export const ganadorPorWO = (ausente) => (ausente === 'LOCAL' ? 'VISITANTE' : ausente === 'VISITANTE' ? 'LOCAL' : null)

// Qué pasa si el partido termina en W.O. (el texto de la vista previa). `ausente` es 'LOCAL' | 'VISITANTE' | 'AMBOS'.
export const efectoDelWO = (partido, ausente) => {
  const ganador = ganadorPorWO(ausente)
  const enZona = !partido.instancia
  if (ganador) {
    const gana = nombreCorto(partido[ganador.toLowerCase()])
    if (enZona) return `${gana} gana por W.O. Se computa 6-0 6-0 en la tabla de posiciones.`
    return partido.siguiente ? `${gana} gana por W.O. y avanza a la instancia siguiente.` : `${gana} gana por W.O. y es el campeón.`
  }
  if (enZona) return 'El partido queda en W.O. sin ganador y sin puntos. No suma victorias a ninguno.'
  return partido.siguiente
    ? 'El partido queda en W.O. sin ganador y sin puntos. El rival del partido siguiente avanza por W.O.'
    : 'El partido queda en W.O. sin ganador y sin puntos. Es la final: el torneo termina sin campeón.'
}

// 'Cuartos de final · Partido 2' / 'Zona A · Fecha 1' (`lugar` es la zona o la instancia, ver `partidosDelCuadro`)
export const tituloDePartido = (partido) =>
  partido.instancia ? `${ETIQUETA_INSTANCIA[partido.instancia]} · Partido ${partido.posicion}` : `${partido.lugar} · Fecha ${partido.ronda}`

// «Baja de M. Pérez · Inasistencia» a partir de `wo` del cuadro; para el avance automático, «Avanza por baja del rival».
export const textoDeWO = (partido) => {
  const { wo } = partido
  if (!wo) return null
  if (wo.motivo === 'AVANCE_POR_BAJA') return 'Avanza por baja del rival'
  const motivo = ETIQUETA_MOTIVO_WO[wo.motivo] ?? wo.motivo
  const quien = wo.ausente === 'AMBOS' ? 'Baja de ambos' : `Baja de ${nombreCorto(partido[wo.ausente.toLowerCase()])}`
  return `${quien} · ${motivo}`
}