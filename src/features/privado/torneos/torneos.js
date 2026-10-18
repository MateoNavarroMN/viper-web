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

// '2026-11-05' → '05/11/2026' (fecha completa, para la ficha)
export const fechaCompleta = (texto) => texto.split('-').reverse().join('/')

export const rangoFechas = (inicio, fin) => (inicio === fin ? fechaCorta(inicio) : `${fechaCorta(inicio)} – ${fechaCorta(fin)}`)

const FORMATO_PRECIO = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 })
export const precio = (valor) => (valor > 0 ? `$ ${FORMATO_PRECIO.format(valor)}` : 'Sin cargo')

// Para buscar sin importar mayúsculas ni tildes ("padel" encuentra "Pádel")
export const normalizar = (texto) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

// Límites del formulario (los mismos que valida la API en M3-BE-02)
export const LIMITES = { nombre: 100, cupoMinimo: 2, cupoMinimoZonas: 6, cupoMaximo: 128, clasificanMinimo: 1, clasificanMaximo: 2 }

// Precio escrito como en Argentina: '8.000', '8000', '8.000,50' o '8000.5' → número (null si no se entiende)
export const leerPrecio = (texto) => {
  const limpio = texto.replace(/\$|\s/g, '')
  if (limpio === '') return null
  let normal
  if (limpio.includes(',')) normal = limpio.replace(/\./g, '').replace(',', '.') // la coma es el decimal
  else if (/^\d{1,3}(\.\d{3})+$/.test(limpio)) normal = limpio.replace(/\./g, '') // puntos de miles
  else normal = limpio
  if (!/^\d+(\.\d{1,2})?$/.test(normal)) return null
  return Number(normal)
}

// 8000 → '8.000' ; 8000.5 → '8.000,5'
export const escribirPrecio = (numero) => FORMATO_PRECIO.format(numero)