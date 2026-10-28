import { useCallback, useEffect, useState } from 'react'
import { get, post } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import Badge from '../../../../shared/components/Badge'
import Button from '../../../../shared/components/Button'
import ConfirmDialog from '../../../../shared/components/ConfirmDialog'
import EstadoBadge from '../../../../shared/components/EstadoBadge'
import Modal from '../../../../shared/components/Modal'
import Spinner from '../../../../shared/components/Spinner'
import { useToast } from '../../../../shared/hooks/useToast'
import { ETIQUETA_DISCIPLINA, fechaCompleta, fechaHora, precio } from '../torneos'

const TITULO_SECCION = 'text-xs font-bold uppercase tracking-wide text-texto-suave mb-2'

function Integrante({ rol, persona }) {
  return (
    <div className="bg-fondo border border-gray-800 rounded-xl p-4">
      <p className="text-[13px] text-texto-suave">{rol}</p>
      <p className="font-semibold break-words">{persona.nombre} {persona.apellido}</p>
      <dl className="mt-2 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-sm">
        <dt className="text-texto-suave">DNI</dt>
        <dd className="tabular-nums">{persona.dni ?? '—'}</dd>
        <dt className="text-texto-suave">Correo</dt>
        <dd className="break-all">{persona.email}</dd>
        <dt className="text-texto-suave">Teléfono</dt>
        <dd className="tabular-nums">{persona.telefono ?? '—'}</dd>
      </dl>
    </div>
  )
}

// Detalle de una inscripción para la Recepción (y el Organizador, que solo la ve): integrantes con su contacto, estado y pago.
// Con `puedeAnular` (Recepcionista y Administrador) ofrece «Anular inscripción», con confirmación: solo con el pago pendiente
// y el torneo sin cuadro. `onCambio` avisa que la inscripción cambió, para que la lista se actualice.
export default function DetalleInscripcion({ inscripcionId, puedeAnular, onCerrar, onCambio }) {
  const { mostrarToast } = useToast()
  const [resultado, setResultado] = useState(null) // { id, datos, error }
  const [confirmando, setConfirmando] = useState(false)
  const [anulando, setAnulando] = useState(false)
  const [reintento, setReintento] = useState(0)

  useEffect(() => {
    let vigente = true
    get(`/inscripciones/${inscripcionId}`)
      .then((datos) => vigente && setResultado({ id: inscripcionId, reintento, datos }))
      .catch((error) => vigente && setResultado({ id: inscripcionId, reintento, error: error.mensaje }))
    return () => {
      vigente = false
    }
  }, [inscripcionId, reintento])

  const actual = resultado?.id === inscripcionId && resultado.reintento === reintento ? resultado : null
  const cerrarConfirmacion = useCallback(() => !anulando && setConfirmando(false), [anulando])

  const anular = async () => {
    setAnulando(true)
    try {
      const respuesta = await post(`/inscripciones/${inscripcionId}/anular`)
      mostrarToast(respuesta.mensaje, 'exito')
      onCambio()
      onCerrar()
    } catch (e) {
      // Otra persona la cobró o la anuló, o el torneo cambió: se avisa y se vuelve a pedir el detalle
      mostrarToast(e.mensaje, 'error')
      onCambio()
      setReintento((n) => n + 1)
    } finally {
      setAnulando(false)
      setConfirmando(false)
    }
  }

  const { inscripcion: i, torneo, motivoSinAnular } = actual?.datos ?? {}
  const pagado = i?.estadoPago === 'PAGADO'

  return (
    <Modal abierto titulo="Detalle de la inscripción" posicion="abajo-movil" onCerrar={onCerrar}>
      {!actual ? (
        <div className="py-10 flex justify-center"><Spinner texto="Cargando inscripción" /></div>
      ) : actual.error ? (
        <Alert variante="error" titulo="No pudimos cargar la inscripción">{actual.error}</Alert>
      ) : (
        <div className="flex flex-col gap-5">
          <div>
            <p className="font-semibold break-words">{torneo.nombre}</p>
            <p className="text-sm text-texto-suave">{ETIQUETA_DISCIPLINA[torneo.disciplina]} · Inscripción {precio(torneo.precioInscripcion)}</p>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <EstadoBadge tipo="inscripcion" estado={i.estado} />
              {i.estado === 'ACTIVA' && <EstadoBadge tipo="pago" estado={i.estadoPago} />}
              {i.cabezaDeSerie && <Badge variante="violeta">Cabeza de serie</Badge>}
            </div>
          </div>

          <div>
            <h3 className={TITULO_SECCION}>{i.companero ? 'Pareja' : 'Jugador'}</h3>
            <div className="flex flex-col gap-3">
              <Integrante rol={i.companero ? 'Titular' : 'Jugador'} persona={i.titular} />
              {i.companero && <Integrante rol="Compañero" persona={i.companero} />}
            </div>
          </div>

          <div>
            <h3 className={TITULO_SECCION}>Inscripción y pago</h3>
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 text-sm">
              <dt className="text-texto-suave">Se inscribió el</dt>
              <dd className="tabular-nums">{fechaCompleta(i.fechaInscripcion.slice(0, 10))}</dd>
              {pagado ? (
                <>
                  <dt className="text-texto-suave">Pagó el</dt>
                  <dd className="tabular-nums">{fechaHora(i.fechaPago)}</dd>
                  {i.pagoRegistradoPor && (
                    <>
                      <dt className="text-texto-suave">Cobró</dt>
                      <dd>{i.pagoRegistradoPor.nombre} {i.pagoRegistradoPor.apellido}</dd>
                    </>
                  )}
                </>
              ) : i.estado === 'ACTIVA' && i.venceEn ? (
                <>
                  <dt className="text-texto-suave">Vence el</dt>
                  <dd className="tabular-nums text-advertencia">{fechaHora(i.venceEn)}</dd>
                </>
              ) : null}
            </dl>
          </div>

          {puedeAnular && (
            <div className="flex flex-col gap-2 pt-1">
              <Button variante="peligro-borde" disabled={Boolean(motivoSinAnular)} onClick={() => setConfirmando(true)}>
                Anular inscripción
              </Button>
              {motivoSinAnular && <p className="text-xs text-texto-suave">{motivoSinAnular}.</p>}
            </div>
          )}
          <Button variante="neutro" onClick={onCerrar}>Cerrar</Button>
        </div>
      )}

      <ConfirmDialog
        abierto={confirmando}
        posicion="abajo-movil"
        tipo="peligro"
        titulo="¿Anular la inscripción?"
        mensaje="Se libera el cupo y la inscripción queda anulada. Si la persona quiere participar, tiene que inscribirse de nuevo."
        textoConfirmar="Anular inscripción"
        textoCancelar="Volver"
        cargando={anulando}
        onConfirmar={anular}
        onCancelar={cerrarConfirmacion}
      />
    </Modal>
  )
}