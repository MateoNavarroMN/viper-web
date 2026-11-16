import { useRef, useState } from 'react'
import { post } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import Button from '../../../../shared/components/Button'
import FormField from '../../../../shared/components/FormField'
import Modal from '../../../../shared/components/Modal'
import Select from '../../../../shared/components/Select'
import { fechaLarga, precio } from '../../torneos/torneos'
import { METODOS_DE_COBRO, fechaHoraCorta } from '../reservas'

function Dato({ titulo, children }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2 border-b border-gray-800 last:border-b-0">
      <dt className="text-sm text-texto-suave shrink-0">{titulo}</dt>
      <dd className="text-sm font-semibold text-right break-words min-w-0">{children}</dd>
    </div>
  )
}

// Registrar el cobro de una reserva Pendiente (recepción). Muestra el resumen y pide el medio de pago (efectivo o transferencia).
//   onCobrada(respuesta): se registró; `respuesta.reserva` es la reserva ya Confirmada.
//   onRechazada(mensaje): la API dijo que no se puede (venció, ya estaba pagada, se canceló...): se cierra y se avisa en la pantalla.
// Un corte de red o un error del servidor se muestra acá mismo, para reintentar sin perder la elección.
export default function CobroReserva({ reserva, onCobrada, onRechazada, onCerrar }) {
  const [metodoPago, setMetodoPago] = useState('EFECTIVO')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const yaEnviado = useRef(false) // frena el doble clic antes de que el botón alcance a deshabilitarse

  const cobrar = async () => {
    if (yaEnviado.current) return
    yaEnviado.current = true
    setEnviando(true)
    setError('')
    try {
      onCobrada(await post(`/reservas/${reserva.id}/cobro`, { metodoPago }))
    } catch (e) {
      yaEnviado.current = false
      setEnviando(false)
      if (e.status === 409 || e.status === 404) onRechazada(e.mensaje)
      else setError(e.mensaje ?? 'No se pudo registrar el cobro')
    }
  }

  const { cliente } = reserva
  return (
    <Modal abierto titulo="Registrar cobro" onCerrar={enviando ? () => {} : onCerrar}>
      <p className="text-texto-suave text-sm mb-3">Confirmá el pago de esta reserva. Queda confirmada al registrarlo.</p>
      <dl className="bg-fondo/60 border border-gray-800 rounded-xl px-4 py-1">
        {cliente && <Dato titulo="Cliente">{cliente.nombre} {cliente.apellido}</Dato>}
        <Dato titulo="Cancha">{reserva.cancha.nombre}</Dato>
        <Dato titulo="Fecha">{fechaLarga(reserva.fecha)}</Dato>
        <Dato titulo="Horario">{reserva.horaInicio} – {reserva.horaFin}</Dato>
        {reserva.expiracionPago && <Dato titulo="Vence el pago">{fechaHoraCorta(reserva.expiracionPago)}</Dato>}
        <Dato titulo="Total a cobrar"><span className="text-base text-viper">{precio(reserva.precioAplicado)}</span></Dato>
      </dl>

      <div className="mt-4">
        <FormField label="Medio de pago" id="cobro-medio" requerido>
          <Select id="cobro-medio" opciones={METODOS_DE_COBRO} value={metodoPago} disabled={enviando} onChange={(e) => setMetodoPago(e.target.value)} />
        </FormField>
      </div>

      {error && <div className="mt-4"><Alert variante="error">{error}</Alert></div>}

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6">
        <Button variante="neutro" onClick={onCerrar} disabled={enviando}>Cancelar</Button>
        <Button onClick={cobrar} cargando={enviando}>Registrar cobro</Button>
      </div>
    </Modal>
  )
}