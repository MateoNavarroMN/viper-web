// Helpers de la sección Socios y cuotas (CU 4.1 y 4.2).

// DNI con puntos de miles: 38221045 → 38.221.045
export const dniConPuntos = (dni) => dni.replace(/\B(?=(\d{3})+(?!\d))/g, '.')

export const OPCIONES_ESTADO_SOCIO = [
  { valor: '', texto: 'Estado: Todos' },
  { valor: 'ACTIVO', texto: 'Activo' },
  { valor: 'BAJA', texto: 'Baja' },
]

export const OPCIONES_CUOTAS_SOCIO = [
  { valor: '', texto: 'Cuotas: Todas' },
  { valor: 'AL_DIA', texto: 'Al día' },
  { valor: 'ADEUDADO', texto: 'Adeudado' },
]

export const DISCIPLINAS = [
  { clave: 'TENIS', texto: 'Tenis' },
  { clave: 'PADEL', texto: 'Pádel' },
]

// Estado que se muestra de una cuota: las pendientes con el vencimiento pasado figuran «Vencida» (la API ya manda `vencida`).
export const estadoDeCuota = (cuota) => (cuota.estadoPago === 'PAGADO' ? 'PAGADA' : cuota.vencida ? 'VENCIDA' : 'PENDIENTE')

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

export const OPCIONES_MES = [{ valor: '', texto: 'Mes: Todos' }, ...MESES.map((texto, i) => ({ valor: String(i + 1), texto }))]

// Años para filtrar: el próximo, el actual y los tres anteriores
export const opcionesAnio = () => {
  const actual = new Date().getFullYear()
  const anios = [actual + 1, actual, actual - 1, actual - 2, actual - 3].map((anio) => ({ valor: String(anio), texto: String(anio) }))
  return [{ valor: '', texto: 'Año: Todos' }, ...anios]
}

export const OPCIONES_ESTADO_CUOTA = [
  { valor: '', texto: 'Estado: Todos' },
  { valor: 'PENDIENTE', texto: 'Pendiente' },
  { valor: 'PAGADO', texto: 'Pagado' },
  { valor: 'ADEUDADO', texto: 'Adeudado' },
]

// El mes y el año de hoy, como los guarda la URL (?mes=11&anio=2026)
export const periodoActual = () => {
  const hoy = new Date()
  return { mes: String(hoy.getMonth() + 1), anio: String(hoy.getFullYear()) }
}

// 11, 2026 → 'Noviembre 2026'
export const nombrePeriodo = (mes, anio) => `${MESES[mes - 1]} ${anio}`

export const ETIQUETA_METODO_PAGO = { EFECTIVO: 'Efectivo', TRANSFERENCIA: 'Transferencia', MERCADO_PAGO: 'Mercado Pago' }

// '2026-11-03T15:20:00.000Z' → '03/11/2026' (la fecha en la zona horaria del club)
export const fechaDePago = (iso) =>
  new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Argentina/Cordoba' })

// El día de hoy en la zona horaria del club, como lo guarda un campo de fecha: '2026-11-08'
export const fechaDeHoy = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Cordoba' })