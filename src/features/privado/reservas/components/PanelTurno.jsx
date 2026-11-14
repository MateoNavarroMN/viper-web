import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Alert from '../../../../shared/components/Alert'
import Button from '../../../../shared/components/Button'
import EstadoBadge from '../../../../shared/components/EstadoBadge'
import Spinner from '../../../../shared/components/Spinner'
import { ETIQUETA_DISCIPLINA, fechaLarga, precio } from '../../torneos/torneos'
import { useReserva } from '../useReserva'
import { ACCIONES_RESERVA, TIPO_LARGO, TIPOS_OCUPACION, fechaHoraCorta, rutaNuevaReserva } from '../reservas'

function Dato({ titulo, children }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2 border-b border-gray-800 last:border-b-0">
      <dt className="text-sm text-texto-suave shrink-0">{titulo}</dt>
      <dd className="text-sm font-semibold text-right break-words min-w-0">{children}</dd>
    </div>
  )
}

// Un turno libre: lo que se va a reservar y el paso siguiente según quién mira (el Jugador reserva; el personal registra un turno directo)
function TurnoLibre({ fecha, cancha, franja, personal }) {
  const navigate = useNavigate()
  return (
    <>
      <dl>
        <Dato titulo="Cancha">{cancha.nombre}</Dato>
        <Dato titulo="Deporte">{ETIQUETA_DISCIPLINA[cancha.deporte]} · {cancha.tipoSuperficie}</Dato>
        <Dato titulo="Fecha">{fechaLarga(fecha)}</Dato>
        <Dato titulo="Horario">{franja.horaInicio} – {franja.horaFin}</Dato>
        <Dato titulo="Precio por hora">{precio(cancha.precioHora)}</Dato>
      </dl>
            {personal ? (
        <>
          <Button disabled title="Próximamente" className="w-full mt-5">Registrar turno directo</Button>
          <p className="text-xs text-texto-suave mt-2 text-center">Próximamente</p>
        </>
      ) : (
        <Button onClick={() => navigate(rutaNuevaReserva({ canchaId: cancha.id, fecha, hora: franja.horaInicio, deporte: cancha.deporte }))} className="w-full mt-5">Reservar</Button>
      )}
    </>
  )
}

// El detalle de una reserva ocupada (solo el personal) con las acciones que la API permite. Las no permitidas se ven
// deshabilitadas con su motivo; las permitidas se habilitan cuando la pantalla recibe su manejador en `acciones`.
function ReservaOcupada({ id, acciones }) {
  const { cargando, error, noExiste, reserva, reintentar } = useReserva(id)

  if (cargando) return <div className="py-10 flex justify-center"><Spinner texto="Cargando la reserva" /></div>
  if (noExiste) return <Alert variante="advertencia">Esta reserva ya no existe. La grilla se actualiza sola.</Alert>
  if (error) {
    return (
      <Alert variante="error" titulo="No pudimos cargar la reserva">
        {error}{' '}
        <button type="button" onClick={reintentar} className="underline font-semibold cursor-pointer">Reintentar</button>
      </Alert>
    )
  }

  const { cliente, contrato, torneo } = reserva
  return (
    <>
      <div className="mb-3"><EstadoBadge tipo="reserva" estado={reserva.estado} /></div>
      <dl>
        {cliente && <Dato titulo="Cliente">{cliente.nombre} {cliente.apellido}{cliente.email && <span className="block text-xs font-normal text-texto-suave">{cliente.email}</span>}</Dato>}
        <Dato titulo="Tipo">{TIPO_LARGO[reserva.tipo]}{torneo && <span className="block text-xs font-normal text-texto-suave">{torneo.nombre}</span>}</Dato>
        <Dato titulo="Cancha">{reserva.cancha.nombre}</Dato>
        <Dato titulo="Fecha">{fechaLarga(reserva.fecha)}</Dato>
        <Dato titulo="Horario">{reserva.horaInicio} – {reserva.horaFin}</Dato>
        {reserva.precioAplicado !== null && <Dato titulo="Precio aplicado">{precio(reserva.precioAplicado)}</Dato>}
        {reserva.estado === 'PENDIENTE' && reserva.expiracionPago && <Dato titulo="Vence el pago">{fechaHoraCorta(reserva.expiracionPago)}</Dato>}
        {contrato && <Dato titulo="Alquiler fijo">{fechaLarga(contrato.fechaInicio)} al {fechaLarga(contrato.fechaFin)}</Dato>}
      </dl>

      <ul className="flex flex-col gap-3 mt-5" aria-label="Acciones">
        {ACCIONES_RESERVA.map(({ clave, texto, variante }) => {
          const { permitido, motivo } = reserva.acciones[clave]
          const manejador = acciones?.[clave]
          const habilitada = permitido && Boolean(manejador)
          return (
            <li key={clave}>
              <Button variante={variante} disabled={!habilitada} onClick={() => manejador?.(reserva)} className="w-full">{texto}</Button>
              {!permitido && <p className="text-xs text-texto-suave mt-1.5">{motivo}</p>}
              {permitido && !manejador && <p className="text-xs text-texto-suave mt-1.5">Próximamente</p>}
            </li>
          )
        })}
      </ul>
    </>
  )
}

// Panel del turno elegido. A un turno libre le muestra los datos para reservarlo; a uno ocupado (solo el personal) el detalle de la
// reserva y sus acciones. Si el turno tiene más de una reserva (por ejemplo, un partido de 90 minutos y un alquiler que lo tocan),
// se elige cuál ver. `enHoja` es el panel dentro de la hoja inferior del celular, que ya trae su propio marco.
export default function PanelTurno({ fecha, cancha, franja, personal, acciones, enHoja = false, onCerrar }) {
  const [indice, setIndice] = useState(0)
  const libre = franja.estado === 'LIBRE'
  const ocupaciones = franja.ocupaciones ?? []
  const ocupacion = ocupaciones[Math.min(indice, ocupaciones.length - 1)]

  return (
    <section aria-label={libre ? 'Turno libre' : 'Reserva'} className={enHoja ? '' : 'bg-panel border border-gray-800 rounded-2xl p-5'}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-outfit text-lg font-bold">{libre ? 'Turno libre' : 'Reserva'}</h3>
        {onCerrar && (
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className="text-texto-suave hover:text-viper transition-colors cursor-pointer">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {libre ? (
        <TurnoLibre fecha={fecha} cancha={cancha} franja={franja} personal={personal} />
      ) : (
        <>
          {ocupaciones.length > 1 && (
            <div role="group" aria-label="Reservas de este turno" className="flex flex-wrap gap-2 mb-4">
              {ocupaciones.map((o, i) => (
                <button
                  key={o.reservaId}
                  type="button"
                  aria-pressed={i === indice}
                  onClick={() => setIndice(i)}
                  className={`px-3 py-1 rounded-full border text-xs font-medium cursor-pointer focus-visible:outline-2 focus-visible:outline-viper ${i === indice ? 'bg-viper/15 border-viper text-viper' : 'bg-fondo border-gray-800 text-texto-suave hover:text-viper'}`}
                >
                  {TIPOS_OCUPACION[o.tipo]?.texto ?? 'Reserva'} {o.horaInicio} – {o.horaFin}
                </button>
              ))}
            </div>
          )}
          <ReservaOcupada key={ocupacion.reservaId} id={ocupacion.reservaId} acciones={acciones} />
        </>
      )}
    </section>
  )
}
