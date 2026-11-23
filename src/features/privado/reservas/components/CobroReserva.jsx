import { useRef, useState } from 'react'
import { post } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import Button from '../../../../shared/components/Button'
import FormField from '../../../../shared/components/FormField'
import Modal from '../../../../shared/components/Modal'
import Select from '../../../../shared/components/Select'
import CobroConEnlace from '../../pagos/components/CobroConEnlace'
import { iniciarPagoEnLinea } from '../../pagos/pagos'
import { fechaLarga, precio } from '../../torneos/torneos'
import { METODOS_DE_COBRO, fechaHoraCorta } from '../reservas'

// Además de efectivo y transferencia, en recepción se puede cobrar con Mercado Pago (enlace y código QR)
const OPCIONES_DE_COBRO = [...METODOS_DE_COBRO, { valor: 'MERCADO_PAGO', texto: 'Mercado Pago (código QR)' }]

function Dato({ titulo, children }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2 border-b border-gray-800 last:border-b-0">
      <dt className="text-sm text-texto-suave shrink-0">{titulo}</dt>
      <dd className="text-sm font-semibold text-right break-words min-w-0">{children}</dd>
    </div>
  )
}

// Registrar el cobro de una reserva Pendiente (recepción). Muestra el resumen y pide el medio de pago (efectivo, transferencia
// o Mercado Pago con código QR).
//   onCobrada(respuesta): se registró; `respuesta.reserva` es la reserva ya Confirmada (con QR solo trae `mensaje`).
//   onRechazada(mensaje): la API dijo que no se puede (venció, ya estaba pagada, se canceló...): se cierra y se avisa en la pantalla.
// Un corte de red o un error del servidor se muestra acá mismo, para reintentar sin perder la elección.
export default function CobroReserva({ reserva, onCobrada, onRechazada, onCerrar }) {
  const [metodoPago, setMetodoPago] = useState('EFECTIVO')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [cobro, setCobro] = useState(null) // { transaccionId, urlPago } del cobro con Mercado Pago
  const yaEnviado = useRef(false) // frena el doble clic antes de que el botón alcance a deshabilitarse

  const cobrar = async () => {
    if (yaEnviado.current) return
    yaEnviado.current = true
    setEnviando(true)
    setError('')
    try {
      if (metodoPago === 'MERCADO_PAGO') {
        const { transaccionId, urlPago } = await iniciarPagoEnLinea('RESERVA', reserva.id)
        setCobro({ transaccionId, urlPago })
        yaEnviado.current = false
        setEnviando(false)
        return
      }
      onCobrada(await post(`/reservas/${reserva.id}/cobro`, { metodoPago }))
    } catch (e) {
      yaEnviado.current = false
      setEnviando(false)
      if (e.status === 409 || e.status === 404) onRechazada(e.mensaje)
      else setError(e.mensaje ?? (metodoPago === 'MERCADO_PAGO' ? 'No pudimos iniciar el cobro con Mercado Pago. Probá de nuevo o elegí otro medio.' : 'No se pudo registrar el cobro'))
    }
  }

  const { cliente } = reserva
  const nombreCliente = cliente ? `${cliente.nombre} ${cliente.apellido}` : 'Reserva'

  if (cobro) {
    return (
      <Modal abierto titulo="Cobro con Mercado Pago" onCerrar={onCerrar}>
        <CobroConEnlace
          concepto="RESERVA"
          pago={cobro}
          detalle={`${nombreCliente} · ${reserva.cancha.nombre} · ${fechaLarga(reserva.fecha)} · ${reserva.horaInicio} – ${reserva.horaFin}`}
          monto={precio(reserva.precioAplicado)}
          onAcreditado={() => onCobrada({ mensaje: 'Cobro acreditado: la reserva quedó confirmada' })}
          onCancelado={onCerrar}
          onCerrar={onCerrar}
        />
      </Modal>
    )
  }

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
          <Select id="cobro-medio" opciones={OPCIONES_DE_COBRO} value={metodoPago} disabled={enviando} onChange={(e) => setMetodoPago(e.target.value)} />
        </FormField>
        {metodoPago === 'MERCADO_PAGO' && (
          <p className="text-sm text-texto-suave mt-2">Se genera un enlace y un código QR para que el cliente pague desde su celular. La reserva queda confirmada cuando se acredita.</p>
        )}
      </div>

      {error && <div className="mt-4"><Alert variante="error">{error}</Alert></div>}

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6">
        <Button variante="neutro" onClick={onCerrar} disabled={enviando}>Cancelar</Button>
        <Button onClick={cobrar} cargando={enviando}>{metodoPago === 'MERCADO_PAGO' ? 'Cobrar con QR' : 'Registrar cobro'}</Button>
      </div>
    </Modal>
  )
}