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