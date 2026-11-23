import { fechaDelDia, horaDelMovimiento, importe } from '../caja/caja'
import { PANTALLAS } from '../layout/navegacion'
import { fechaDeHoy } from '../socios/socios'

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

// ---------------------------------------------------------------------------------------------------------------------------
// Alertas y bloques operativos
// ---------------------------------------------------------------------------------------------------------------------------

// Cada tipo de alerta: cómo se la nombra según la cantidad, su detalle y qué tan urgente es (`error` = rojo, `advertencia` = ámbar).
// El orden de esta lista es el orden de urgencia en el que se muestran: primero lo que hace perder plata o clientes.
const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`
export const ALERTAS = {
  DEVOLUCIONES_PENDIENTES: { gravedad: 'error', texto: (n) => `${plural(n, 'pago en línea para devolver', 'pagos en línea para devolver')}`, ayuda: 'Cobros que llegaron fuera de plazo' },
  CAJA_SIN_CERRAR: { gravedad: 'error', texto: (n) => `${plural(n, 'jornada sin cerrar', 'jornadas sin cerrar')}`, ayuda: 'Cajas de días anteriores' },
  CAJA_DESCUADRADA: { gravedad: 'advertencia', texto: (n) => `${plural(n, 'caja cerrada con diferencia', 'cajas cerradas con diferencia')}`, ayuda: 'De los últimos 7 días' },
  RESERVAS_POR_VENCER: { gravedad: 'advertencia', texto: (n) => `${plural(n, 'reserva por vencer sin pago', 'reservas por vencer sin pago')}`, ayuda: 'Vencen en menos de 6 horas' },
  INSCRIPCIONES_POR_VENCER: { gravedad: 'advertencia', texto: (n) => `${plural(n, 'inscripción por vencer sin pago', 'inscripciones por vencer sin pago')}`, ayuda: 'Vencen en menos de 6 horas' },
  SOCIOS_CON_CUOTAS_VENCIDAS: { gravedad: 'error', texto: (n) => `${plural(n, 'socio con cuotas vencidas', 'socios con cuotas vencidas')}`, ayuda: 'Cuotas pendientes vencidas' },
  PRODUCTOS_SIN_STOCK: { gravedad: 'error', texto: (n) => `${plural(n, 'producto sin stock', 'productos sin stock')}`, ayuda: 'Productos activos agotados' },
}
const ORDEN_DE_ALERTAS = Object.keys(ALERTAS)

// Las alertas que devuelve la API, de la más urgente a la menos urgente (un tipo desconocido va al final, con el título de la API)
const lugar = (tipo) => (ORDEN_DE_ALERTAS.includes(tipo) ? ORDEN_DE_ALERTAS.indexOf(tipo) : ORDEN_DE_ALERTAS.length)
export const ordenarAlertas = (alertas) => [...alertas].sort((a, b) => lugar(a.tipo) - lugar(b.tipo))

export const textoDeAlerta = (alerta) => ALERTAS[alerta.tipo]?.texto(alerta.cantidad) ?? `${alerta.cantidad} · ${alerta.titulo}`

// «/gestion/socios?pestana=cuotas» → «Socios y cuotas»: el nombre de la pantalla a la que lleva una alerta
export const nombreDeDestino = (destino) => {
  const ruta = destino.split('?')[0]
  return Object.values(PANTALLAS).find((p) => p.ruta === ruta)?.texto ?? 'la pantalla'
}

const MS_DIA = 86400000
const fechaDelClub = (iso) => new Date(iso).toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Cordoba' })

// Cuándo ocurrió algo, en palabras: «Hace 25 min», «Hace 2 h», «Ayer», «Hace 3 días» o la fecha si pasó más de una semana
export const haceCuanto = (iso) => {
  const minutos = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (minutos < 60) return `Hace ${Math.max(1, minutos)} min`
  const horas = Math.floor(minutos / 60)
  if (horas < 24 && fechaDelClub(iso) === fechaDeHoy()) return `Hace ${horas} h`
  const dias = Math.round((Date.parse(`${fechaDeHoy()}T00:00:00Z`) - Date.parse(`${fechaDelClub(iso)}T00:00:00Z`)) / MS_DIA)
  if (dias <= 1) return 'Ayer'
  if (dias < 7) return `Hace ${dias} días`
  return fechaDelDia(fechaDelClub(iso))
}

// Cuándo vence algo: «hoy 20:30», «mañana 09:00» o «25/11 18:00»
export const cuandoVence = (iso) => {
  const dia = fechaDelClub(iso)
  const hoy = fechaDeHoy()
  const manana = new Date(Date.parse(`${hoy}T00:00:00Z`) + MS_DIA).toISOString().slice(0, 10)
  const cuando = dia === hoy ? 'hoy' : dia === manana ? 'mañana' : fechaDelDia(dia).slice(0, 5)
  return `${cuando} ${horaDelMovimiento(iso)}`
}

// Color de la barra de cupo de un torneo según su estado
export const COLOR_ESTADO_TORNEO = { EN_CURSO: 'bg-info', INSCRIPCIONES_ABIERTAS: 'bg-exito', INSCRIPCIONES_CERRADAS: 'bg-advertencia', PLANIFICADO: 'bg-texto-suave' }