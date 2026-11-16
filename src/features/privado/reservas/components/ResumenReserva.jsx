import EstadoBadge from '../../../../shared/components/EstadoBadge'
import { fechaLarga, precio } from '../../torneos/torneos'
import { TEXTO_METODO_PAGO, fechaHoraCorta } from '../reservas'

// Resumen de la reserva que acaba de cargar el Jugador o Recepción (es el detalle que devuelve la API al crearla).
// `conCliente` suma el cliente (lo usa Recepción; al Jugador no le hace falta). Una reserva ya cobrada muestra el pago en lugar del plazo.
export default function ResumenReserva({ reserva, conCliente = false }) {
  const cobrada = reserva.estado === 'CONFIRMADA' && reserva.metodoPago
  const filas = [
    ...(conCliente && reserva.cliente ? [['Cliente', `${reserva.cliente.nombre} ${reserva.cliente.apellido}`]] : []),
    ['Cancha', reserva.cancha.nombre],
    ['Fecha', fechaLarga(reserva.fecha)],
    ['Horario', `${reserva.horaInicio} – ${reserva.horaFin}`],
    ['Total', precio(reserva.precioAplicado)],
    cobrada
      ? ['Pago', `${TEXTO_METODO_PAGO[reserva.metodoPago] ?? reserva.metodoPago} · ${fechaHoraCorta(reserva.fechaPago)}`]
      : ['Vence el pago', reserva.expiracionPago ? fechaHoraCorta(reserva.expiracionPago) : '—'],
  ]
  return (
    <dl className="bg-fondo/60 border border-gray-800 rounded-xl px-4 py-2">
      <div className="flex items-center justify-between gap-4 py-2 border-b border-gray-800">
        <dt className="text-sm text-texto-suave">Estado</dt>
        <dd><EstadoBadge tipo="reserva" estado={reserva.estado} /></dd>
      </div>
      {filas.map(([titulo, valor]) => (
        <div key={titulo} className="flex items-baseline justify-between gap-4 py-2 border-b border-gray-800 last:border-b-0">
          <dt className="text-sm text-texto-suave shrink-0">{titulo}</dt>
          <dd className="text-sm font-semibold text-right">{valor}</dd>
        </div>
      ))}
    </dl>
  )
}