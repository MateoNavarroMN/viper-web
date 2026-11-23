import { fechaDelDia, importe } from '../caja/caja'

// Helpers del Dashboard del Administrador (balance, filtros y gráficos).

export const DIAS_MAXIMOS = 366

// Rubros del balance, con el nombre que se ve en pantalla
export const ETIQUETA_RUBRO = {
  TIENDA: 'Tienda',
  RESERVA: 'Reserva',
  INSCRIPCION: 'Inscripción',
  CUOTA: 'Cuota',
  PROVEEDOR: 'Proveedor',
  SERVICIOS: 'Servicios',
  OTRO: 'Otro',
}

export const OPCIONES_RUBRO = [
  { valor: '', texto: 'Todos' },
  ...Object.entries(ETIQUETA_RUBRO).map(([valor, texto]) => ({ valor, texto })),
]

export const ETIQUETA_MEDIO = { EFECTIVO: 'Efectivo', TRANSFERENCIA: 'Transferencia', MERCADO_PAGO: 'Mercado Pago' }

// Color de cada medio de pago (tokens del diseño: nunca un hex suelto)
export const COLOR_MEDIO = { EFECTIVO: 'bg-exito', TRANSFERENCIA: 'bg-info', MERCADO_PAGO: 'bg-violeta' }

// Los rubros que reciben ingresos y los que generan egresos (lo define la base: un egreso solo es de Proveedor, Servicios u Otro)
export const RUBROS_DE_INGRESO = ['RESERVA', 'CUOTA', 'TIENDA', 'INSCRIPCION']
export const RUBROS_DE_EGRESO = ['PROVEEDOR', 'SERVICIOS', 'OTRO']

// $ 1.500,00 · con signo si es negativo: − $ 300,00
export const dinero = (valor) => (valor < 0 ? `− ${importe(-valor)}` : importe(valor))

// Sin centavos para los desgloses: $ 612.000
const FORMATO_ENTERO = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 })
export const dineroCorto = (valor) => `$ ${FORMATO_ENTERO.format(Math.round(valor))}`

// «01/11 a 18/11/2026»
export const rangoEscrito = (desde, hasta) => `${fechaDelDia(desde).slice(0, 5)} a ${fechaDelDia(hasta)}`

const diasEntre = (desde, hasta) => Math.round((Date.parse(`${hasta}T00:00:00Z`) - Date.parse(`${desde}T00:00:00Z`)) / 86400000)

// Controla el rango antes de pedirlo. Devuelve el mensaje de error o null si es válido.
// Son las mismas reglas que aplica la API (12a): así se informa al instante y no se pide un rango que se sabe inválido.
export const errorDeRango = (desde, hasta) => {
  if (!desde || !hasta) return { titulo: 'Elegí las dos fechas', detalle: 'Completá la fecha desde y la fecha hasta para ver el período.' }
  if (desde > hasta) return { titulo: 'Rango de fechas inválido', detalle: 'La fecha «desde» es posterior a «hasta».' }
  if (diasEntre(desde, hasta) + 1 > DIAS_MAXIMOS) return { titulo: 'Rango de fechas inválido', detalle: `El período no puede superar los ${DIAS_MAXIMOS} días.` }
  return null
}

// «1,2 M» · «50 mil» · «800»: para las marcas del eje del gráfico
export const montoCompacto = (valor) => {
  const v = Math.abs(valor)
  if (v >= 1_000_000) return `${(valor / 1_000_000).toLocaleString('es-AR', { maximumFractionDigits: 1 })} M`
  if (v >= 1000) return `${(valor / 1000).toLocaleString('es-AR', { maximumFractionDigits: 1 })} mil`
  return String(valor)
}

// Un máximo «redondo» para el eje vertical y sus marcas: 0, paso, 2·paso… (paso de 1, 2 o 5 por una potencia de 10)
export const escalaVertical = (maximo, marcas = 4) => {
  if (!(maximo > 0)) return { tope: 1, valores: [0, 1] }
  const crudo = maximo / marcas
  const potencia = 10 ** Math.floor(Math.log10(crudo))
  const paso = [1, 2, 5, 10].map((m) => m * potencia).find((p) => p >= crudo)
  const cantidad = Math.ceil(maximo / paso)
  return { tope: paso * cantidad, valores: Array.from({ length: cantidad + 1 }, (_, i) => i * paso) }
}

// Qué días rotular en el eje horizontal: como mucho `max`, siempre el primero y el último
export const indicesDeRotulos = (cantidad, max = 6) => {
  if (cantidad <= max) return Array.from({ length: cantidad }, (_, i) => i)
  const paso = (cantidad - 1) / (max - 1)
  return [...new Set(Array.from({ length: max }, (_, i) => Math.round(i * paso)))]
}