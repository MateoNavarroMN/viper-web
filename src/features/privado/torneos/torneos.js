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

// '2026-10-20T16:49:43Z' → '20/10 a las 13:49' (hora local del navegador)
export const fechaHora = (iso) => {
  const f = new Date(iso)
  const dos = (n) => String(n).padStart(2, '0')
  return `${dos(f.getDate())}/${dos(f.getMonth() + 1)} a las ${dos(f.getHours())}:${dos(f.getMinutes())}`
}

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

// 1840 → '1.840 pts'
const FORMATO_PUNTOS = new Intl.NumberFormat('es-AR')
export const puntosTexto = (puntos) => `${FORMATO_PUNTOS.format(puntos)} pts`

// 'Juan Pérez' o, en Pádel, 'Juan Pérez / Luis Ríos' (la pareja de una inscripción)
export const nombrePareja = (inscripcion) =>
  [inscripcion.titular, inscripcion.companero].filter(Boolean).map((p) => `${p.nombre} ${p.apellido}`).join(' / ')

// Cómo se calcula el máximo de cabezas de serie según el formato (lo valida la API, CU 3.3 · 5a)
export const REGLA_CABEZAS = { ELIMINACION_DIRECTA: 'un cuarto del cuadro', ZONAS_Y_ELIMINACION: 'una por zona' }

// Nombre de cada instancia del cuadro de eliminación (`instancia` de la API)
export const ETIQUETA_INSTANCIA = {
  FINAL: 'Final',
  SEMIFINAL: 'Semifinales',
  CUARTOS: 'Cuartos de final',
  OCTAVOS: 'Octavos de final',
  DIECISEISAVOS: 'Dieciseisavos de final',
  TREINTAIDOSAVOS: 'Treintaidosavos de final',
  SESENTAYCUATROAVOS: 'Sesentaicuatroavos de final',
}

// 'M. Pérez' o, en Pádel, 'M. Pérez / L. Ríos': el nombre de un participante del cuadro, abreviado para que entre en el partido
export const nombreCorto = (participante) =>
  [participante.titular, participante.companero].filter(Boolean).map((p) => `${p.nombre.charAt(0)}. ${p.apellido}`).join(' / ')

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

// '2026-11-12' → 'Jue 12/11'. El día de la semana sale de la fecha en UTC para no correrla de día.
export const diaCorto = (fecha) => {
  const [anio, mes, dia] = fecha.split('-').map(Number)
  const diaSemana = DIAS[new Date(Date.UTC(anio, mes - 1, dia)).getUTCDay()]
  return `${diaSemana} ${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}`
}

// ('2026-11-12', '10:00') → 'Jue 12/11 · 10:00'
export const fechaPartido = (fecha, hora) => `${diaCorto(fecha)} · ${hora}`

// '2026-11-12' → 'Jue 12/11/2026'
export const fechaLarga = (fecha) => `${diaCorto(fecha)}/${fecha.slice(0, 4)}`

// ('2026-11-07', 1) → '2026-11-08'
export const sumarDias = (fecha, dias) => new Date(Date.parse(`${fecha}T00:00:00Z`) + dias * 86400000).toISOString().slice(0, 10)

// Cada día del período, de inicio a fin inclusive (hasta un año, por si las fechas vinieran mal)
export const diasEntre = (inicio, fin) => {
  const dias = []
  for (let dia = inicio; dia <= fin && dias.length < 366; dia = sumarDias(dia, 1)) dias.push(dia)
  return dias
}

// El día siguiente (el calendario de «Ampliar fecha de fin» empieza ahí)
export const diaSiguiente = (fecha) => sumarDias(fecha, 1)

// Acciones que el Organizador y el Administrador tienen sobre un partido del cuadro (`acciones` de <Bracket>).
// Cada pantalla les agrega su `onClick` al armarlas; sin `onClick` el botón queda deshabilitado.
const conRivales = (partido) => !partido.esBye && Boolean(partido.local && partido.visitante)
const sinJugar = (partido) => partido.estado === 'PENDIENTE' || partido.estado === 'PROGRAMADO'
export const ACCIONES_PARTIDO = [
  { clave: 'RESULTADO', texto: 'Cargar resultado', variante: 'primario', disponible: (p) => conRivales(p) && p.estado === 'PROGRAMADO' },
  { clave: 'CORREGIR', texto: 'Corregir resultado', variante: 'neutro', disponible: (p) => conRivales(p) && p.estado === 'FINALIZADO' },
  { clave: 'REPROGRAMAR', texto: (p) => (p.estado === 'PENDIENTE' ? 'Programar' : 'Reprogramar'), variante: 'neutro', disponible: (p) => conRivales(p) && sinJugar(p) },
  { clave: 'WO', texto: 'Registrar W.O.', variante: 'peligro-borde', disponible: (p) => conRivales(p) && sinJugar(p) },
]

// ACCIONES_PARTIDO con su `onClick` para quien gestiona el torneo: «Programar» / «Reprogramar», «Cargar resultado» y «Corregir
// resultado» y «Registrar W.O.» llevan a sus pantallas (`navigate` es el de react-router).
// `motivoSinCorreccion(partido)` devuelve por qué no se puede corregir un resultado (o null): con motivo, el botón queda
// deshabilitado y el detalle del partido muestra el texto (CU 3.6 · 6a).
const PANTALLA_DE_ACCION = { REPROGRAMAR: 'programar', RESULTADO: 'resultado', CORREGIR: 'corregir-resultado', WO: 'wo' }
export const accionesDeGestion = (torneoId, navigate, motivoSinCorreccion = () => null) =>
  ACCIONES_PARTIDO.map((a) => {
    if (!PANTALLA_DE_ACCION[a.clave]) return a
    const accion = { ...a, onClick: (partido) => navigate(`/gestion/torneos/${torneoId}/partidos/${partido.id}/${PANTALLA_DE_ACCION[a.clave]}`) }
    return a.clave === 'CORREGIR' ? { ...accion, motivo: motivoSinCorreccion } : accion
  })

// ¿Existe la pantalla para generar la fase eliminatoria (CU 3.9)? El aviso de «Todas las zonas quedaron cerradas» ofrece el botón.
export const FASE_ELIMINATORIA_DISPONIBLE = true