import { useEffect, useState } from 'react'
import { get } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import BottomSheet from '../../../../shared/components/BottomSheet'
import Button from '../../../../shared/components/Button'
import EstadoBadge from '../../../../shared/components/EstadoBadge'
import Spinner from '../../../../shared/components/Spinner'
import { ETIQUETA_CONCEPTO, ETIQUETA_METODO_PAGO, fechaYHora, importe, importeConSigno } from '../caja'
import FormularioAnulacion from './FormularioAnulacion'

const ETIQUETA_ORIGEN = { RESERVA: 'Reserva', INSCRIPCION: 'Inscripción', CUOTA: 'Cuota' }
const ETIQUETA_ESTADO_ORIGEN = {
  PENDIENTE: 'Pendiente',
  CONFIRMADA: 'Confirmada',
  CANCELADA: 'Cancelada',
  EXPIRADA: 'Expirada',
  PAGADO: 'Pagado',
  PAGADA: 'Pagada',
}

function Dato({ titulo, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-0.5 sm:gap-4 py-2 border-b border-gray-800 last:border-0">
      <dt className="text-sm text-texto-suave shrink-0">{titulo}</dt>
      <dd className="text-sm sm:text-right min-w-0 break-words">{children}</dd>
    </div>
  )
}

// Por qué no se ofrece anular (null si se puede). Solo se anula un movimiento aprobado de una caja abierta.
const motivoSinAnular = (movimiento) => {
  if (movimiento.cajaCerrada) return 'La caja de ese día ya fue cerrada: el movimiento no se puede anular.'
  if (movimiento.metodoPago === 'MERCADO_PAGO') return 'Un pago en línea no se anula desde la caja: la devolución se gestiona en Mercado Pago.'
  return null
}

function Contenido({ movimiento, onAnular }) {
  const anulado = movimiento.estado === 'ANULADO'
  const sinAnular = movimiento.estado === 'APROBADO' ? motivoSinAnular(movimiento) : null
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-texto-suave">{ETIQUETA_CONCEPTO[movimiento.concepto]}</p>
          <p className={`font-outfit text-3xl font-bold tabular-nums ${anulado ? 'line-through text-texto-suave' : movimiento.tipo === 'INGRESO' ? 'text-exito' : 'text-error'}`}>
            {importeConSigno(movimiento)}
          </p>
        </div>
        <EstadoBadge tipo="movimiento" estado={movimiento.estado} />
      </div>

      {anulado && movimiento.anulacion && (
        <Alert variante="advertencia" titulo="Movimiento anulado">
          {movimiento.anulacion.motivo}
          <span className="block text-xs mt-1 opacity-80">
            Por {movimiento.anulacion.anuladoPor} · {fechaYHora(movimiento.anulacion.fecha)}
          </span>
        </Alert>
      )}

      <dl>
        <Dato titulo="Fecha y hora">{fechaYHora(movimiento.fechaHora)}</Dato>
        <Dato titulo="Tipo">{movimiento.tipo === 'INGRESO' ? 'Ingreso' : 'Egreso'}</Dato>
        <Dato titulo="Medio de pago">{ETIQUETA_METODO_PAGO[movimiento.metodoPago]}</Dato>
        <Dato titulo="Cliente">{movimiento.cliente ?? 'Consumidor final'}</Dato>
        <Dato titulo="Registrado por">{movimiento.operador ?? 'Pago en línea'}</Dato>
        {movimiento.descripcion && <Dato titulo="Descripción">{movimiento.descripcion}</Dato>}
        {movimiento.origen && (
          <Dato titulo={ETIQUETA_ORIGEN[movimiento.origen.tipo] ?? 'Origen'}>
            {movimiento.origen.descripcion}
            {movimiento.origen.estado && <span className="block text-xs text-texto-suave">{ETIQUETA_ESTADO_ORIGEN[movimiento.origen.estado] ?? movimiento.origen.estado}</span>}
          </Dato>
        )}
      </dl>

      {movimiento.productos?.length > 0 && (
        <section aria-label="Productos vendidos">
          <h3 className="text-xs font-bold uppercase tracking-wide text-texto-suave mb-2">Productos</h3>
          <ul className="flex flex-col gap-2">
            {movimiento.productos.map((p) => (
              <li key={p.productoId} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate">
                  {p.cantidad} × {p.nombre}
                  <span className="block text-xs text-texto-suave tabular-nums">{importe(p.precioUnitario)} c/u</span>
                </span>
                <span className="tabular-nums shrink-0">{importe(p.subtotal)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {movimiento.estado === 'APROBADO' && (
        <div className="flex flex-col gap-2 border-t border-gray-800 pt-4">
          <Button variante="peligro-borde" onClick={onAnular} disabled={Boolean(sinAnular)}>
            Anular movimiento
          </Button>
          {sinAnular && <p className="text-xs text-texto-suave">{sinAnular}</p>}
        </div>
      )}
      {movimiento.cajaCerrada && movimiento.estado !== 'APROBADO' && <p className="text-xs text-texto-suave">La caja de ese día ya fue cerrada: el movimiento no admite cambios.</p>}
    </div>
  )
}

// Panel con el detalle de un movimiento (cliente, origen, operador y, en una venta, los productos). Se monta con `key={id}`:
// cada movimiento que se abre arranca cargando.
// `onCambio()` avisa que el movimiento cambió (se anuló) para que la lista y los totales se vuelvan a pedir.
export default function DetalleMovimiento({ id, onCerrar, onCambio }) {
  const [respuesta, setRespuesta] = useState(null) // { clave, datos } | { clave, error }
  const [reintento, setReintento] = useState(0)
  const [anulando, setAnulando] = useState(false) // se está viendo el paso «Anular»

  useEffect(() => {
    let vigente = true
    get(`/caja/movimientos/${id}`)
      .then((r) => vigente && setRespuesta({ clave: reintento, datos: r.movimiento }))
      .catch((e) => vigente && setRespuesta({ clave: reintento, error: e.mensaje }))
    return () => {
      vigente = false
    }
  }, [id, reintento])

  const cargando = respuesta?.clave !== reintento

  return (
    <BottomSheet abierto titulo={anulando ? 'Anular movimiento' : 'Detalle del movimiento'} onCerrar={onCerrar}>
      {cargando ? (
        <div className="py-10 flex justify-center">
          <Spinner texto="Cargando el movimiento" />
        </div>
      ) : respuesta.error ? (
        <div className="flex flex-col gap-4">
          <Alert variante="error" titulo="No pudimos cargar el movimiento">
            {respuesta.error}
          </Alert>
          <div className="flex gap-3 justify-end">
            <Button variante="secundario" onClick={onCerrar}>
              Cerrar
            </Button>
            <Button onClick={() => setReintento((n) => n + 1)}>Reintentar</Button>
          </div>
        </div>
      ) : anulando ? (
        <FormularioAnulacion
          movimiento={respuesta.datos}
          onVolver={() => setAnulando(false)}
          onAnulado={(anulado) => {
            setRespuesta({ clave: reintento, datos: anulado })
            setAnulando(false)
            onCambio()
          }}
          onDesactualizado={() => {
            setAnulando(false)
            setReintento((n) => n + 1)
            onCambio()
          }}
        />
      ) : (
        <Contenido movimiento={respuesta.datos} onAnular={() => setAnulando(true)} />
      )}
    </BottomSheet>
  )
}