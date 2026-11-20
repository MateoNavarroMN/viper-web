import { post } from '../../../shared/api/client'

// Pago en línea con Mercado Pago. Se usa para una reserva, una inscripción o una cuota ('RESERVA' | 'INSCRIPCION' | 'CUOTA').
// La API deja un pago pendiente y responde { transaccionId, urlPago }: hay que llevar a la persona a `urlPago`, donde paga en el
// entorno seguro de Mercado Pago. Viper nunca ve ni guarda datos de tarjeta.
export const iniciarPagoEnLinea = (concepto, origenId) => post('/pagos/mercadopago', { concepto, origenId })

// Los dos medios que se ofrecen en la pantalla de pago
export const MEDIOS_DE_PAGO = [
  { clave: 'EN_LINEA', titulo: 'Pagar en línea con Mercado Pago', detalle: 'Tarjeta, dinero en cuenta o efectivo en un punto de cobro' },
  { clave: 'RECEPCION', titulo: 'Pagar en recepción', detalle: 'Efectivo o transferencia en el club' },
]