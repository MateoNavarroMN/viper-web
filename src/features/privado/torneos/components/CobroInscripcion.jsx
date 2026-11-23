import { useState } from 'react'
import Alert from '../../../../shared/components/Alert'
import Button from '../../../../shared/components/Button'
import FormField from '../../../../shared/components/FormField'
import Modal from '../../../../shared/components/Modal'
import Select from '../../../../shared/components/Select'
import CobroConEnlace from '../../pagos/components/CobroConEnlace'
import { iniciarPagoEnLinea } from '../../pagos/pagos'
import { precio } from '../torneos'

const MEDIOS = [
  { valor: 'EFECTIVO', texto: 'Efectivo' },
  { valor: 'MERCADO_PAGO', texto: 'Mercado Pago (código QR)' },
]

const nombreCompleto = (p) => `${p.nombre} ${p.apellido}`

// Cobro de una inscripción pendiente (recepción): en efectivo o con Mercado Pago (enlace y código QR).
//   inscripcion        la fila de la lista (titular, compañero, id)
//   torneoNombre       nombre del torneo, para el texto
//   precioInscripcion  opcional, se muestra en el resumen
//   enviando           el efectivo se está registrando (lo maneja la lista)
//   onEfectivo()       confirma que se recibió el efectivo (la lista llama a la API y actualiza)
//   onAcreditado()     el pago con Mercado Pago se acreditó y la persona toca «Listo»
//   onRechazada(msg)   la API dijo que no se puede (venció, ya estaba pagada...)
//   onCerrar()         se cierra sin hacer nada más (un cobro con Mercado Pago ya iniciado sigue pendiente hasta 1 hora)
export default function CobroInscripcion({ inscripcion, torneoNombre, precioInscripcion, enviando, onEfectivo, onAcreditado, onRechazada, onCerrar }) {
  const [medio, setMedio] = useState('EFECTIVO')
  const [iniciando, setIniciando] = useState(false)
  const [error, setError] = useState('')
  const [cobro, setCobro] = useState(null) // { transaccionId, urlPago }

  const pareja = inscripcion.companero ? ` y ${nombreCompleto(inscripcion.companero)}` : ''
  const quien = `${nombreCompleto(inscripcion.titular)}${pareja}`
  const monto = precioInscripcion > 0 ? precio(precioInscripcion) : null

  const iniciarEnLinea = async () => {
    setError('')
    setIniciando(true)
    try {
      const { transaccionId, urlPago } = await iniciarPagoEnLinea('INSCRIPCION', inscripcion.id)
      setCobro({ transaccionId, urlPago })
    } catch (e) {
      if (e.status === 409 || e.status === 404) {
        onRechazada(e.mensaje)
        return
      }
      setError(e.status === 0 ? 'No hay conexión con el servidor.' : 'No pudimos iniciar el cobro con Mercado Pago. Probá de nuevo o registrá el pago en efectivo.')
    }
    setIniciando(false)
  }

  if (cobro) {
    return (
      <Modal abierto titulo="Cobro con Mercado Pago" onCerrar={onCerrar}>
        <CobroConEnlace
          concepto="INSCRIPCION"
          pago={cobro}
          detalle={`${quien} · ${torneoNombre}`}
          monto={monto ?? 'el total de la inscripción'}
          onAcreditado={onAcreditado}
          onCancelado={onCerrar}
          onCerrar={onCerrar}
        />
      </Modal>
    )
  }

  const ocupado = enviando || iniciando
  return (
    <Modal abierto titulo="Registrar pago" onCerrar={ocupado ? () => {} : onCerrar}>
      <p className="text-sm text-texto-suave">Inscripción de {quien} a «{torneoNombre}»{monto ? ` · ${monto}` : ''}.</p>

      <div className="mt-4">
        <FormField label="Medio de pago" id="cobro-inscripcion-medio" requerido>
          <Select id="cobro-inscripcion-medio" opciones={MEDIOS} value={medio} disabled={ocupado} onChange={(e) => setMedio(e.target.value)} />
        </FormField>
        <p className="text-sm text-texto-suave mt-2">
          {medio === 'EFECTIVO'
            ? 'Confirmá que recibiste el efectivo. La inscripción queda pagada al registrarlo.'
            : 'Se genera un enlace y un código QR para que el jugador pague desde su celular. La inscripción queda pagada cuando se acredita.'}
        </p>
      </div>

      {error && <div className="mt-4"><Alert variante="error">{error}</Alert></div>}

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6">
        <Button variante="neutro" onClick={onCerrar} disabled={ocupado}>Volver</Button>
        {medio === 'EFECTIVO'
          ? <Button onClick={onEfectivo} cargando={enviando}>Registrar pago</Button>
          : <Button onClick={iniciarEnLinea} cargando={iniciando}>Cobrar con QR</Button>}
      </div>
    </Modal>
  )
}