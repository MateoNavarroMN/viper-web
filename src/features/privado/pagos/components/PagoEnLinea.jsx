import { useRef, useState } from 'react'
import Alert from '../../../../shared/components/Alert'
import Button from '../../../../shared/components/Button'
import Spinner from '../../../../shared/components/Spinner'
import { MEDIOS_DE_PAGO, iniciarPagoEnLinea } from '../pagos'

const irAMercadoPago = (url) => window.location.assign(url)

// Elección del medio de pago y botón para pagar. Lo comparten reservas, inscripciones y cuotas.
//  · concepto, origenId   qué se paga ('RESERVA' | 'INSCRIPCION' | 'CUOTA' y su id)
//  · total                el importe ya formateado, para el botón
//  · nombreOrigen         cómo se llama lo que se paga, para los textos («reserva», «inscripción», «cuota»)
//  · onRecepcion          la persona prefiere pagar en recepción (vuelve a la lista: lo pendiente sigue pendiente)
//  · textoVolver          texto del botón de volver (por defecto «Volver a mis …s»)
//  · onVolver             vuelve a la lista cuando no se puede pagar (el origen ya se pagó, venció o se canceló)
//  · alIrAMercadoPago     solo para pruebas: reemplaza la redirección
// Al pagar en línea se le pide la orden a la API y se redirige a `urlPago`. Si el servicio de pago falla, el pago queda anulado en
// la API y se ofrece reintentar o pagar en recepción. Si lo que se paga ya no está pendiente, se avisa y no se redirige.
export default function PagoEnLinea({ concepto, origenId, total, nombreOrigen, textoVolver, onRecepcion, onVolver, alIrAMercadoPago = irAMercadoPago }) {
  const [medio, setMedio] = useState('EN_LINEA')
  const [fase, setFase] = useState('elegir') // 'elegir' | 'redirigiendo'
  const [enviando, setEnviando] = useState(false)
  const [problema, setProblema] = useState(null) // { mensaje, definitivo }
  const yaEnviado = useRef(false) // frena el doble clic antes de que el botón alcance a deshabilitarse

  const pagarEnLinea = async () => {
    if (yaEnviado.current) return
    yaEnviado.current = true
    setEnviando(true)
    setProblema(null)
    try {
      const { urlPago } = await iniciarPagoEnLinea(concepto, origenId)
      setFase('redirigiendo')
      alIrAMercadoPago(urlPago)
    } catch (e) {
      yaEnviado.current = false
      setEnviando(false)
      // 400, 404 y 409: lo que se quería pagar ya no se puede pagar (ya pagado, vencido, cancelado). Un corte o un error del servicio se puede reintentar.
      const definitivo = [400, 404, 409].includes(e.status)
      setProblema({ mensaje: definitivo ? (e.mensaje ?? 'Lo que querés pagar ya no está disponible.') : e.status === 0 ? 'No hay conexión con el servidor.' : 'Mercado Pago no respondió.', definitivo })
    }
  }

  if (fase === 'redirigiendo') {
    return (
      <section aria-label="Redirección" className="bg-panel border border-gray-800 rounded-2xl p-8 flex flex-col items-center gap-3 text-center">
        <Spinner texto="Te llevamos a Mercado Pago" />
        <p className="text-texto-suave">No cierres esta ventana. Vas a volver a Viper al terminar.</p>
        <p className="font-semibold">Total a pagar · {total}</p>
      </section>
    )
  }

  // Lo que se quería pagar ya no se puede pagar: se muestra el motivo y no se redirige
  if (problema?.definitivo) {
    return (
      <section aria-label="No se puede iniciar el pago" className="flex flex-col gap-4">
        <Alert variante="advertencia" titulo="No se puede iniciar el pago">{problema.mensaje}</Alert>
        <div className="flex justify-end"><Button onClick={onVolver}>{textoVolver ?? `Volver a mis ${nombreOrigen}s`}</Button></div>
      </section>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {problema && (
        <Alert variante="error" titulo="No pudimos iniciar el pago">
          {problema.mensaje} Tu {nombreOrigen} sigue pendiente.
        </Alert>
      )}

      <fieldset className="bg-panel border border-gray-800 rounded-2xl p-5">
        <legend className="sr-only">Cómo querés pagar</legend>
        <h2 className="font-outfit text-lg font-bold mb-3" aria-hidden="true">¿Cómo querés pagar?</h2>
        <div className="flex flex-col gap-3">
          {MEDIOS_DE_PAGO.map(({ clave, titulo, detalle }) => {
            const marcado = medio === clave
            return (
              <label
                key={clave}
                className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors hover:border-viper ${
                  marcado ? 'border-viper bg-viper/10' : 'border-gray-800 bg-fondo'
                } has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-viper`}
              >
                <input
                  type="radio"
                  name="medio-de-pago"
                  value={clave}
                  checked={marcado}
                  onChange={() => setMedio(clave)}
                  className="mt-1 accent-[var(--color-viper)] size-4 shrink-0"
                />
                <span className="min-w-0">
                  <span className="block font-semibold">{titulo}</span>
                  <span className="block text-sm text-texto-suave mt-0.5">{detalle}</span>
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
        <Button variante="neutro" onClick={onVolver} disabled={enviando} className="w-full sm:w-auto">Volver</Button>
        {medio === 'EN_LINEA' ? (
          <Button onClick={pagarEnLinea} cargando={enviando} className="w-full sm:w-auto">
            {problema ? 'Reintentar' : `Pagar en línea · ${total}`}
          </Button>
        ) : (
          <Button onClick={onRecepcion} className="w-full sm:w-auto">Pagar en recepción</Button>
        )}
      </div>
    </div>
  )
}