import { useRef, useState } from 'react'
import { post } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import Button from '../../../../shared/components/Button'
import Checkbox from '../../../../shared/components/Checkbox'
import Modal from '../../../../shared/components/Modal'
import { fechaLarga, precio } from '../../torneos/torneos'
import { ANTICIPACION_CANCELACION_HORAS, faltaPocoParaElTurno } from '../reservas'

function Dato({ titulo, children }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2 border-b border-gray-800 last:border-b-0">
      <dt className="text-sm text-texto-suave shrink-0">{titulo}</dt>
      <dd className="text-sm font-semibold text-right break-words min-w-0">{children}</dd>
    </div>
  )
}

// Confirmación para cancelar una reserva (la usan el panel de la grilla del club y «Mis reservas»). Cuenta las consecuencias: la
// franja queda libre; si ya estaba paga, el reembolso se gestiona fuera del sistema; si es de un alquiler fijo, se cancela solo esa
// fecha. Al personal, con menos de 3 horas para el turno, le advierte que es una cancelación fuera de plazo y le pide confirmarlo.
//   onCancelada(respuesta): se canceló; `respuesta.reembolsoFueraDelSistema` avisa si había plata cobrada.
//   onRechazada(mensaje): la API dijo que no se puede (ya cancelada, venció, empezó el turno...): se cierra y se avisa en la pantalla.
//   onCerrar(): «Volver», sin tocar nada.
export default function CancelarReserva({ reserva, personal, onCancelada, onRechazada, onCerrar }) {
  const [fueraDePlazo, setFueraDePlazo] = useState(() => personal && faltaPocoParaElTurno(reserva.fecha, reserva.horaInicio))
  const [entiendo, setEntiendo] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const yaEnviado = useRef(false) // frena el doble clic antes de que el botón alcance a deshabilitarse

  const pagada = reserva.estado === 'CONFIRMADA' && Number(reserva.precioAplicado) > 0
  const fija = reserva.tipo === 'FIJA'
  const bloqueada = fueraDePlazo && !entiendo

  const cancelar = async () => {
    if (yaEnviado.current) return
    yaEnviado.current = true
    setEnviando(true)
    setError('')
    try {
      onCancelada(await post(`/reservas/${reserva.id}/cancelar`, fueraDePlazo ? { confirmarFueraDePlazo: true } : {}))
    } catch (e) {
      yaEnviado.current = false
      setEnviando(false)
      if (e.status === 409 && e.datos?.requiereConfirmacion) {
        // La API ve la hora distinto que el navegador: se pide la confirmación igual
        setFueraDePlazo(true)
      } else if (e.status === 409 || e.status === 404) {
        onRechazada(e.mensaje)
      } else {
        setError(e.mensaje ?? 'No se pudo cancelar la reserva')
      }
    }
  }

  return (
    <Modal abierto titulo="Cancelar reserva" posicion="abajo-movil" onCerrar={enviando ? () => {} : onCerrar}>
      <h2 className="font-outfit text-xl font-bold mb-2">¿Cancelar esta reserva?</h2>
      <dl className="bg-fondo/60 border border-gray-800 rounded-xl px-4 py-1">
        {reserva.cliente && <Dato titulo="Cliente">{reserva.cliente.nombre} {reserva.cliente.apellido}</Dato>}
        <Dato titulo="Cancha">{reserva.cancha.nombre}</Dato>
        <Dato titulo="Fecha">{fechaLarga(reserva.fecha)}</Dato>
        <Dato titulo="Horario">{reserva.horaInicio} – {reserva.horaFin}</Dato>
        <Dato titulo="Precio">{precio(reserva.precioAplicado ?? 0)}</Dato>
      </dl>

      <ul className="mt-4 flex flex-col gap-2 text-sm text-texto-suave list-disc pl-5">
        <li>La franja queda libre para que la reserve otra persona.</li>
        {pagada && <li>La reserva ya estaba paga: <span className="text-texto">el reembolso se gestiona fuera del sistema</span>, directamente con el club.</li>}
        {fija && (
          <li>
            Es un turno de un <span className="text-texto">alquiler fijo</span>: se cancela solo esta fecha y el contrato sigue con las demás.{' '}
            {personal ? 'Para finalizar el contrato usá «Alquileres fijos».' : 'Para finalizar el contrato, comunicate con recepción.'}
          </li>
        )}
      </ul>

      {fueraDePlazo && (
        <div className="mt-4 flex flex-col gap-3">
          <Alert variante="advertencia" titulo="Cancelación fuera de plazo">
            Faltan menos de {ANTICIPACION_CANCELACION_HORAS} horas para el turno. Un Jugador ya no podría cancelarlo; vos podés hacerlo igual.
          </Alert>
          <label className="flex items-start gap-3 cursor-pointer text-sm">
            <Checkbox checked={entiendo} onChange={(e) => setEntiendo(e.target.checked)} disabled={enviando} />
            <span className="pt-0.5">Confirmo la cancelación fuera de plazo</span>
          </label>
        </div>
      )}

      {error && <div className="mt-4"><Alert variante="error">{error}</Alert></div>}

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6">
        <Button variante="neutro" onClick={onCerrar} disabled={enviando}>Volver</Button>
        <Button variante="peligro" onClick={cancelar} cargando={enviando} disabled={bloqueada}>Cancelar reserva</Button>
      </div>
    </Modal>
  )
}