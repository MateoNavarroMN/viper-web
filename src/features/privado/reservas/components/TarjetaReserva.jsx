import { useEffect, useState } from 'react'
import Badge from '../../../../shared/components/Badge'
import Button from '../../../../shared/components/Button'
import EstadoBadge from '../../../../shared/components/EstadoBadge'
import { ETIQUETA_DISCIPLINA, fechaLarga, precio } from '../../torneos/torneos'
import { ACCIONES_JUGADOR, fechaHoraCorta, tiempoRestante } from '../reservas'

// Cuánto falta para que venza el pago de una reserva Pendiente. Se actualiza cada 30 segundos y, al llegar a cero, avisa
// (`onVencida`) para que la lista se vuelva a pedir y la reserva figure como Expirada.
function CuentaRegresiva({ hasta, onVencida }) {
  const [ahora, setAhora] = useState(() => Date.now())
  const falta = new Date(hasta).getTime() - ahora

  useEffect(() => {
    const cada = setInterval(() => setAhora(Date.now()), 30000)
    return () => clearInterval(cada)
  }, [])
  useEffect(() => {
    if (falta <= 0) onVencida()
  }, [falta, onVencida])

  return falta > 0 ? <span className="font-semibold">Vence en {tiempoRestante(falta)}</span> : <span className="font-semibold">Venció el plazo de pago</span>
}

// Una reserva del Jugador. `acciones` (opcional) trae los manejadores de «Modificar horario» y «Cancelar reserva»: mientras una
// acción permitida no tiene el suyo, se ve deshabilitada con «Próximamente».
export default function TarjetaReserva({ reserva, conAcciones, acciones, onVencida }) {
  const { cancha, contrato, estado } = reserva
  const pendiente = estado === 'PENDIENTE' && reserva.expiracionPago
  const fija = reserva.tipo === 'FIJA'

  return (
    <li className="bg-panel border border-gray-800 rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-outfit text-lg font-bold">{fechaLarga(reserva.fecha)}</h3>
          <p className="text-texto-suave">{reserva.horaInicio} – {reserva.horaFin}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {fija && <Badge variante="info">Alquiler fijo</Badge>}
          <EstadoBadge tipo="reserva" estado={estado} />
        </div>
      </div>

      <p className="text-sm">
        <span className="font-semibold">{cancha.nombre}</span>
        <span className="text-texto-suave"> · {ETIQUETA_DISCIPLINA[cancha.deporte]} · {cancha.tipoSuperficie}</span>
        <span className="text-texto-suave"> · </span>
        <span className="font-semibold">{precio(reserva.precioAplicado ?? 0)}</span>
      </p>

      {fija && contrato && <p className="text-sm text-texto-suave">Parte de tu contrato, hasta el {fechaLarga(contrato.fechaFin)}.</p>}

      {pendiente && (
        <div className="rounded-xl border border-advertencia/50 bg-advertencia/10 px-4 py-3 text-sm">
          <p>Pagá antes del <span className="font-semibold">{fechaHoraCorta(reserva.expiracionPago)}</span>{acciones?.pagar ? ', en línea o en recepción' : ' en recepción'}; si no, el turno se libera.</p>
          <p className="text-advertencia mt-1"><CuentaRegresiva hasta={reserva.expiracionPago} onVencida={onVencida} /></p>
          {acciones?.pagar && reserva.tipo === 'OCASIONAL' && reserva.precioAplicado > 0 && (
            <Button onClick={() => acciones.pagar(reserva)} className="w-full sm:w-auto mt-3">Pagar en línea</Button>
          )}
        </div>
      )}
      {estado === 'EXPIRADA' && <p className="text-sm text-texto-suave">Venció el plazo de pago y el turno se liberó.</p>}

      {conAcciones && (
        <ul className="grid gap-3 sm:grid-cols-2" aria-label="Acciones">
          {ACCIONES_JUGADOR.map(({ clave, texto, variante }) => {
            const { permitido, motivo } = reserva.acciones[clave]
            const manejador = acciones?.[clave]
            return (
              <li key={clave}>
                <Button variante={variante} disabled={!permitido || !manejador} onClick={() => manejador?.(reserva)} className="w-full">{texto}</Button>
                {!permitido && <p className="text-xs text-texto-suave mt-1.5">{motivo}</p>}
                {permitido && !manejador && <p className="text-xs text-texto-suave mt-1.5">Próximamente</p>}
              </li>
            )
          })}
        </ul>
      )}
    </li>
  )
}