// Textos y formatos de los torneos que comparten las pantallas de gestión y del portal.

export const ETIQUETA_DISCIPLINA = { TENIS: 'Tenis', PADEL: 'Pádel' }
export const ETIQUETA_FORMATO = { ELIMINACION_DIRECTA: 'Eliminación Directa', ZONAS_Y_ELIMINACION: 'Zonas + Eliminación' }

// Pestañas del listado de gestión, con los estados de cada una (mismo criterio que `vista` en la API)
export const VISTAS = {
  activos: ['PLANIFICADO', 'INSCRIPCIONES_ABIERTAS', 'INSCRIPCIONES_CERRADAS', 'EN_CURSO'],
  historicos: ['FINALIZADO', 'CANCELADO', 'ARCHIVADO'],
}

const anioActual = () => new Date().getFullYear()

// '2026-11-05' → '05/11' (y '05/11/25' si no es de este año). La fecha llega como texto para no correrla de día.
const fechaCorta = (texto) => {
  const [anio, mes, dia] = texto.split('-')
  return Number(anio) === anioActual() ? `${dia}/${mes}` : `${dia}/${mes}/${anio.slice(2)}`
}

export const rangoFechas = (inicio, fin) => (inicio === fin ? fechaCorta(inicio) : `${fechaCorta(inicio)} – ${fechaCorta(fin)}`)

const FORMATO_PRECIO = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 })
export const precio = (valor) => (valor > 0 ? `$ ${FORMATO_PRECIO.format(valor)}` : 'Sin cargo')

// Para buscar sin importar mayúsculas ni tildes ("padel" encuentra "Pádel")
export const normalizar = (texto) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()