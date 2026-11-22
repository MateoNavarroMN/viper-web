import { ETIQUETA_INSTANCIA, fechaCompleta } from '../torneos/torneos'

// Portal del Jugador (CU 6.4). Textos y ayudas de los bloques del panel de inicio.

export const TEXTO_DISCIPLINA = { TENIS: 'Tenis', PADEL: 'Pádel' }

const FORMATO_PUNTOS = new Intl.NumberFormat('es-AR')
export const escribirPuntos = (n) => FORMATO_PUNTOS.format(n)

// Hace cuánto se publicó un comunicado: «Hace 12 min», «Hace 2 h», «Ayer», «Hace 3 días» y, pasado un mes, la fecha
export const haceCuanto = (iso, ahora = Date.now()) => {
  const minutos = Math.max(0, Math.floor((ahora - new Date(iso).getTime()) / 60000))
  if (minutos < 1) return 'Recién'
  if (minutos < 60) return `Hace ${minutos} min`
  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `Hace ${horas} h`
  const dias = Math.floor(horas / 24)
  if (dias === 1) return 'Ayer'
  if (dias <= 30) return `Hace ${dias} días`
  return fechaCompleta(new Date(iso).toISOString().slice(0, 10))
}

// En qué etapa del torneo es un partido: «Zona A» o la instancia del cuadro («Cuartos de final», «Final»…)
export const etapaDelPartido = (partido) => partido.zona ?? ETIQUETA_INSTANCIA[partido.instancia] ?? 'Eliminatoria'

// En qué fase está un torneo en curso (`faseActual` de la API)
export const ETAPA_DEL_TORNEO = { ZONAS: 'Fase de zonas', ELIMINATORIA: 'Fase eliminatoria' }