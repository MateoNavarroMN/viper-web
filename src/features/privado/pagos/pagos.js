import { get, post } from '../../../shared/api/client'

// Pago en línea con Mercado Pago. Se usa para una reserva, una inscripción o una cuota ('RESERVA' | 'INSCRIPCION' | 'CUOTA').
// La API deja un pago pendiente y responde { transaccionId, urlPago }: hay que llevar a la persona a `urlPago`, donde paga en el
// entorno seguro de Mercado Pago. Viper nunca ve ni guarda datos de tarjeta.
export const iniciarPagoEnLinea = (concepto, origenId) => post('/pagos/mercadopago', { concepto, origenId })

// Los dos medios que se ofrecen en la pantalla de pago
export const MEDIOS_DE_PAGO = [
  { clave: 'EN_LINEA', titulo: 'Pagar en línea con Mercado Pago', detalle: 'Tarjeta, dinero en cuenta o efectivo en un punto de cobro' },
  { clave: 'RECEPCION', titulo: 'Pagar en recepción', detalle: 'Efectivo o transferencia en el club' },
]
// Dirección a la que vuelve la persona desde Mercado Pago (la arma la API: .../portal/pago/resultado?estado=…&ref=<id del pago>).
// La pantalla no se fía de `estado`: pide el estado real del pago a la API con `ref`.
export const RUTA_RESULTADO_PAGO = '/portal/pago/resultado'

// Estado de un pago en línea: PAGADO, PENDIENTE, RECHAZADO, CANCELADO o VENCIDO (ver GET /pagos/:id)
export const consultarPago = (id) => get(`/pagos/${id}`)

// La persona volvió sin pagar: se anula el pago pendiente. Si ya se había acreditado, la API responde 409.
export const cancelarPago = (id) => post(`/pagos/${id}/cancelar`)

export const ETIQUETA_CONCEPTO = { RESERVA: 'Reserva', INSCRIPCION: 'Inscripción', CUOTA: 'Cuota' }

// Cómo queda lo que se pagó cuando el pago se acredita
export const ESTADO_ORIGEN_PAGADO = { RESERVA: 'Confirmada', INSCRIPCION: 'Pagada', CUOTA: 'Pagada' }

// Mensaje de pago aprobado: para el Jugador y para quien cobra en recepción
export const MENSAJE_APROBADO = {
  JUGADOR: { RESERVA: 'Tu reserva quedó confirmada', INSCRIPCION: 'Tu inscripción quedó pagada', CUOTA: 'Tu cuota quedó al día' },
  PERSONAL: { RESERVA: 'La reserva quedó confirmada', INSCRIPCION: 'La inscripción quedó pagada', CUOTA: 'La cuota quedó pagada' },
}

// A dónde se vuelve para ver lo que se pagó, según quién mira
export const DESTINO_DEL_ORIGEN = {
  JUGADOR: {
    RESERVA: { ruta: '/portal/reservas?pestana=mis-reservas', texto: 'Ver mis reservas' },
    INSCRIPCION: { ruta: '/portal/torneos?vista=mias', texto: 'Ver mis inscripciones' },
    CUOTA: { ruta: '/perfil?seccion=actividad', texto: 'Ver mis cuotas' },
  },
  PERSONAL: {
    RESERVA: { ruta: '/gestion/reservas', texto: 'Ver las reservas' },
    INSCRIPCION: { ruta: '/gestion/inscripciones', texto: 'Ver las inscripciones' },
    CUOTA: { ruta: '/gestion/socios?pestana=cuotas', texto: 'Ver las cuotas' },
  },
}

// «Pago en línea de reserva · Pádel 1 · 21/11/2026 de 17:00 a 18:00» → «Pádel 1 · 21/11/2026 de 17:00 a 18:00»
export const detalleDelPago = (descripcion) => (descripcion ?? '').replace(/^Pago en línea de [^·]+·\s*/, '')