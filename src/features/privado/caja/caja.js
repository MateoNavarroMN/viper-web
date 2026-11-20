import { ETIQUETA_METODO_PAGO } from '../socios/socios'

// Helpers de la sección Caja (movimientos y cierre).

export { ETIQUETA_METODO_PAGO }

export const ETIQUETA_CONCEPTO = {
  RESERVA: 'Reserva',
  INSCRIPCION: 'Inscripción',
  CUOTA: 'Cuota',
  TIENDA: 'Venta de tienda',
  PROVEEDOR: 'Proveedor',
  SERVICIOS: 'Servicios',
  OTRO: 'Otro',
}

export const OPCIONES_TIPO_MOVIMIENTO = [
  { valor: '', texto: 'Tipo: Todos' },
  { valor: 'INGRESO', texto: 'Ingresos' },
  { valor: 'EGRESO', texto: 'Egresos' },
]

export const OPCIONES_CONCEPTO = [
  { valor: '', texto: 'Concepto: Todos' },
  ...Object.entries(ETIQUETA_CONCEPTO).map(([valor, texto]) => ({ valor, texto })),
]

export const OPCIONES_METODO_PAGO = [
  { valor: '', texto: 'Medio de pago: Todos' },
  ...Object.entries(ETIQUETA_METODO_PAGO).map(([valor, texto]) => ({ valor, texto })),
]

const ZONA = 'America/Argentina/Cordoba'
const FORMATO_IMPORTE = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// 1500 → '$ 1.500,00'
export const importe = (valor) => `$ ${FORMATO_IMPORTE.format(valor)}`

// Con signo según el tipo: ingreso '+ $ 1.500,00', egreso '− $ 500,00'
export const importeConSigno = (movimiento) => `${movimiento.tipo === 'INGRESO' ? '+' : '−'} ${importe(movimiento.monto)}`

// '2026-11-20T18:45:12Z' → '15:45' (hora del club)
export const horaDelMovimiento = (iso) => new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: ZONA })

// '2026-11-20T18:45:12Z' → '20/11/2026 · 15:45'
export const fechaYHora = (iso) =>
  `${new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: ZONA })} · ${horaDelMovimiento(iso)}`

// '2026-11-20' → '20/11/2026'
export const fechaDelDia = (texto) => texto.split('-').reverse().join('/')
// Qué se puede cobrar desde la caja y cómo se llama en plural (para el aviso «no tiene … pendientes de cobro»)
export const OPCIONES_CONCEPTO_COBRO = [
  { valor: 'RESERVA', texto: 'Reserva' },
  { valor: 'INSCRIPCION', texto: 'Inscripción a un torneo' },
  { valor: 'CUOTA', texto: 'Cuota de socio' },
]
export const OPCIONES_CONCEPTO_EGRESO = [
  { valor: 'PROVEEDOR', texto: 'Pago a proveedor' },
  { valor: 'SERVICIOS', texto: 'Servicios' },
  { valor: 'OTRO', texto: 'Otro gasto' },
]
export const OPCIONES_MEDIO_REGISTRO = [
  { valor: 'EFECTIVO', texto: 'Efectivo' },
  { valor: 'TRANSFERENCIA', texto: 'Transferencia' },
]
export const PENDIENTES_DE = { RESERVA: 'reservas', INSCRIPCION: 'inscripciones', CUOTA: 'cuotas' }
export const DESCRIPCION_MAXIMA = 200

// Anulación de un movimiento (hasta cuántos caracteres puede tener el motivo y qué pasa con cada tipo de movimiento)
export const MOTIVO_ANULACION_MAXIMO = 200
export const EFECTO_DE_ANULAR = {
  TIENDA: 'Se devuelve al stock lo que se vendió.',
  RESERVA: 'La reserva vuelve a quedar pendiente de pago, con un plazo nuevo para pagarla.',
  INSCRIPCION: 'La inscripción vuelve a quedar con el pago pendiente, con un plazo nuevo para pagarla.',
  CUOTA: 'La cuota vuelve a quedar pendiente: el socio puede volver a figurar como adeudado.',
  PROVEEDOR: 'El egreso deja de contar en la caja.',
  SERVICIOS: 'El egreso deja de contar en la caja.',
  OTRO: 'El egreso deja de contar en la caja.',
}

// Cierre de caja
const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

// '2026-11-18' → 'Miércoles 18/11/2026'
export const diaConNombre = (texto) => `${DIAS_SEMANA[new Date(`${texto}T12:00:00Z`).getUTCDay()]} ${fechaDelDia(texto)}`

// '2026-11-18' → '18/11'
export const diaYMes = (texto) => fechaDelDia(texto).slice(0, 5)

// Diferencia entre lo declarado y lo calculado, en pesos y sin errores de punto flotante (la cuenta se hace en centavos)
export const diferenciaDeCaja = (declarado, calculado) => Math.round(declarado * 100 - calculado * 100) / 100

// 500 → '+ $ 500,00' ; -500 → '− $ 500,00' ; 0 → '$ 0,00'
export const diferenciaConSigno = (diferencia) => (diferencia === 0 ? importe(0) : `${diferencia > 0 ? '+' : '−'} ${importe(Math.abs(diferencia))}`)

// -500 → 'Faltan $ 500,00 de efectivo' ; 500 → 'Sobran $ 500,00 de efectivo'
export const faltaOSobra = (diferencia) => `${diferencia < 0 ? 'Faltan' : 'Sobran'} ${importe(Math.abs(diferencia))} de efectivo`

export const MENSAJE_MONTO_INVALIDO = 'Ingresá un monto válido'