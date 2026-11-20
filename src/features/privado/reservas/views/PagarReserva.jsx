import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Button from '../../../../shared/components/Button'
import Alert from '../../../../shared/components/Alert'
import EmptyState from '../../../../shared/components/EmptyState'
import EstadoBadge from '../../../../shared/components/EstadoBadge'
import Spinner from '../../../../shared/components/Spinner'
import PagoEnLinea from '../../pagos/components/PagoEnLinea'
import ResumenDelPago from '../../pagos/components/ResumenDelPago'
import { ETIQUETA_DISCIPLINA, fechaLarga, precio } from '../../torneos/torneos'
import { fechaHoraCorta } from '../reservas'
import { useReserva } from '../useReserva'

const REGEX_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MIS_RESERVAS = '/portal/reservas?pestana=mis-reservas'

// Por qué una reserva ya no se puede pagar en línea (o null si se puede)
const motivoNoPagable = (reserva, ahora) => {
  if (reserva.estado === 'CONFIRMADA') return 'Esta reserva ya está paga.'
  if (reserva.estado === 'CANCELADA') return 'Esta reserva está cancelada.'
  if (reserva.estado === 'EXPIRADA' || (reserva.estado === 'PENDIENTE' && reserva.expiracionPago && new Date(reserva.expiracionPago).getTime() <= ahora)) {
    return 'El plazo de pago de esta reserva venció y la franja fue liberada.'
  }
  if (reserva.estado !== 'PENDIENTE' || reserva.tipo !== 'OCASIONAL' || !(reserva.precioAplicado > 0)) return 'Esta reserva no se paga en línea.'
  return null
}

// Pantalla «Pagar reserva»: el Jugador elige pagar en línea con Mercado Pago o en recepción. Al pagar en línea se lo lleva al entorno de
// pago de Mercado Pago y vuelve a Viper al terminar. Se llega desde la solicitud de reserva y desde «Mis reservas».
export default function PagarReserva() {
  const { reservaId } = useParams()
  const navigate = useNavigate()
  const [ahora] = useState(() => Date.now())
  const valido = REGEX_ID.test(reservaId ?? '')
  const { cargando, error, reserva, noExiste, reintentar } = useReserva(valido ? reservaId : '')
  const volver = () => navigate(MIS_RESERVAS)

  if (!valido || noExiste) {
    return <EmptyState titulo="No encontramos esa reserva" descripcion="Revisá tus reservas para elegir cuál pagar." accion={<Button onClick={volver}>Ir a mis reservas</Button>} />
  }
  if (cargando) return <div className="py-16 flex justify-center"><Spinner texto="Cargando la reserva" /></div>
  if (error) {
    return (
      <Alert variante="error" titulo="No pudimos cargar la reserva">
        {error}{' '}
        <button type="button" onClick={reintentar} className="underline font-semibold cursor-pointer">Reintentar</button>
      </Alert>
    )
  }

  const motivo = motivoNoPagable(reserva, ahora)
  const titulo = `${reserva.cancha.nombre} · ${fechaLarga(reserva.fecha)} · ${reserva.horaInicio} a ${reserva.horaFin}`
  const total = precio(reserva.precioAplicado ?? 0)

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div>
        <Link to={MIS_RESERVAS} className="text-sm text-texto-suave hover:text-viper transition-colors">← Volver a mis reservas</Link>
        <h1 className="font-outfit text-[28px] font-bold mt-2">Pagar reserva</h1>
        <p className="text-texto-suave mt-1">{motivo ? 'Esta reserva no se puede pagar ahora.' : 'Elegí cómo abonar tu reserva pendiente.'}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px] items-start">
        <div className="flex flex-col gap-4 lg:col-start-1 lg:row-start-1">
          <section aria-label="Reserva a pagar" className="bg-panel border border-gray-800 rounded-2xl p-5 flex flex-col gap-2">
            <h2 className="text-xs font-semibold tracking-wide text-texto-suave uppercase">Reserva a pagar</h2>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="font-outfit text-lg font-bold">{titulo}</p>
              <EstadoBadge tipo="reserva" estado={motivo && reserva.estado === 'PENDIENTE' ? 'EXPIRADA' : reserva.estado} />
            </div>
            <p className="text-sm text-texto-suave">{ETIQUETA_DISCIPLINA[reserva.cancha.deporte]} · {reserva.cancha.tipoSuperficie}</p>
            {reserva.estado === 'PENDIENTE' && reserva.expiracionPago && !motivo && (
              <p className="text-sm text-texto-suave">Vence el {fechaHoraCorta(reserva.expiracionPago)} · Después se libera la franja</p>
            )}
            <p className="text-xl font-bold text-viper">{total}</p>
          </section>

          {motivo ? (
            <section aria-label="No se puede iniciar el pago" className="flex flex-col gap-4">
              <Alert variante="advertencia" titulo="No se puede iniciar el pago">{motivo}</Alert>
              <div className="flex justify-end"><Button onClick={volver}>Volver a mis reservas</Button></div>
            </section>
          ) : (
            <PagoEnLinea concepto="RESERVA" origenId={reserva.id} total={total} nombreOrigen="reserva" onRecepcion={volver} onVolver={volver} />
          )}
        </div>

        {!motivo && (
          <div className="lg:col-start-2 lg:row-start-1">
            <ResumenDelPago
              filas={[
                { titulo: 'Concepto', valor: 'Reserva' },
                { titulo: 'Cancha', valor: reserva.cancha.nombre },
                { titulo: 'Fecha y hora', valor: `${fechaLarga(reserva.fecha)} · ${reserva.horaInicio}` },
              ]}
              total={total}
            />
          </div>
        )}
      </div>
    </div>
  )
}