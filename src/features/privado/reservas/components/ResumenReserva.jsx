import EstadoBadge from '../../../../shared/components/EstadoBadge'
import { fechaLarga, precio } from '../../torneos/torneos'
import { fechaHoraCorta } from '../reservas'

// Resumen de la reserva que acaba de pedir el Jugador (es el detalle que devuelve la API al crearla)
export default function ResumenReserva({ reserva }) {
  const filas = [
    ['Cancha', reserva.cancha.nombre],
    ['Fecha', fechaLarga(reserva.fecha)],
    ['Horario', `${reserva.horaInicio} – ${reserva.horaFin}`],
    ['Total', precio(reserva.precioAplicado)],
    ['Vence el pago', reserva.expiracionPago ? fechaHoraCorta(reserva.expiracionPago) : '—'],
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