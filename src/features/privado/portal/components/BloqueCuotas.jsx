import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Alert from '../../../../shared/components/Alert'
import Button from '../../../../shared/components/Button'
import EstadoBadge from '../../../../shared/components/EstadoBadge'
import Modal from '../../../../shared/components/Modal'
import { estadoDeCuota, fechaDePago, nombrePeriodo } from '../../socios/socios'
import { escribirPrecio, fechaCompleta } from '../../torneos/torneos'
import { usePortal } from '../usePortal'
import BloquePortal from './BloquePortal'

const HISTORIAL_VISIBLE = 5

// Entra a la pantalla de pago de la cuota; al terminar, «Volver» lleva de nuevo al inicio del portal
const irAPagar = (navigate, cuota) => navigate(`/perfil/cuotas/${cuota.id}/pagar`, { state: { desde: 'portal' } })

const detalleDeFila = (cuota, estado) => {
  if (estado === 'PAGADA') return `Pagada el ${fechaDePago(cuota.fechaPago)}`
  return `${estado === 'VENCIDA' ? 'Venció' : 'Vence'} el ${fechaCompleta(cuota.fechaVencimiento)}`
}

// Una cuota: período, vencimiento o fecha de pago, monto y estado. Si está pendiente, «Pagar en línea». Tocarla abre su detalle.
function FilaCuota({ cuota, onAbrir, onPagar }) {
  const estado = estadoDeCuota(cuota)
  return (
    <li className="py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
      <button
        type="button"
        onClick={() => onAbrir(cuota)}
        className="min-w-0 flex-1 text-left cursor-pointer hover:text-viper transition-colors focus-visible:outline-2 focus-visible:outline-viper rounded"
      >
        <span className="block text-sm break-words">{nombrePeriodo(cuota.mes, cuota.anio)}</span>
        <span className="block text-xs text-texto-suave break-words">{detalleDeFila(cuota, estado)}</span>
      </button>
      <div className="flex flex-wrap items-center sm:justify-end gap-2">
        <span className="text-sm tabular-nums whitespace-nowrap mr-1">$ {escribirPrecio(Number(cuota.monto))}</span>
        <EstadoBadge tipo="cuota" estado={estado} />
        {cuota.estadoPago === 'PENDIENTE' && (
          <Button tamano="compacto" onClick={() => onPagar(cuota)} className="text-xs whitespace-nowrap !px-3 !py-1.5">
            Pagar en línea
          </Button>
        )}
      </div>
    </li>
  )
}

// Detalle de una cuota: mes, monto, vencimiento, fecha de pago y estado.
function DetalleCuota({ cuota, onCerrar, onPagar }) {
  const estado = estadoDeCuota(cuota)
  const filas = [
    ['Mes', nombrePeriodo(cuota.mes, cuota.anio)],
    ['Monto', `$ ${escribirPrecio(Number(cuota.monto))}`],
    ['Vencimiento', fechaCompleta(cuota.fechaVencimiento)],
    ['Fecha de pago', cuota.fechaPago ? fechaDePago(cuota.fechaPago) : 'Sin pagar'],
  ]
  return (
    <Modal abierto titulo={`Cuota de ${nombrePeriodo(cuota.mes, cuota.anio)}`} posicion="abajo-movil" onCerrar={onCerrar}>
      <dl className="flex flex-col divide-y divide-gray-800">
        {filas.map(([titulo, valor]) => (
          <div key={titulo} className="flex items-center justify-between gap-4 py-3">
            <dt className="text-sm text-texto-suave">{titulo}</dt>
            <dd className="text-sm font-semibold text-right break-words">{valor}</dd>
          </div>
        ))}
        <div className="flex items-center justify-between gap-4 py-3">
          <dt className="text-sm text-texto-suave">Estado</dt>
          <dd><EstadoBadge tipo="cuota" estado={estado} /></dd>
        </div>
      </dl>
      {cuota.estadoPago === 'PENDIENTE' && <Button onClick={() => onPagar(cuota)} className="w-full mt-4">Pagar en línea</Button>}
    </Modal>
  )
}

// Bloque «Mis cuotas»: solo para socios. Estado (Al día / Adeudado), monto adeudado, cuotas pendientes e historial de pagos.
// Quien no es socio ve cómo asociarse en lugar de las cuotas.
export default function BloqueCuotas() {
  const portal = usePortal('/portal/cuotas')
  const navigate = useNavigate()
  const [abierta, setAbierta] = useState(null)
  const [verTodo, setVerTodo] = useState(false)
  const { datos } = portal
  const historial = datos?.historial ?? []
  const pagar = (cuota) => irAPagar(navigate, cuota)

  return (
    <>
      <BloquePortal titulo="Mis cuotas" estado={portal}>
        {datos && !datos.esSocio && (
          <div className="flex flex-col gap-1 py-2">
            <p className="text-sm font-semibold">Todavía no sos socio del club</p>
            <p className="text-sm text-texto-suave">
              Los socios ven acá el estado de sus cuotas, su historial de pagos y pueden pagarlas en línea. Para asociarte, acercate a recepción.
            </p>
          </div>
        )}

        {datos?.esSocio && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-texto-suave">Estado de tus cuotas</p>
              <EstadoBadge tipo="cuotasSocio" estado={datos.situacion} />
            </div>

            {datos.situacion === 'ADEUDADO' && (
              <Alert variante="advertencia" titulo="Tenés cuotas vencidas">
                Adeudás <strong>$ {escribirPrecio(datos.montoAdeudado)}</strong>. Podés pagarlas en línea o en recepción.
              </Alert>
            )}

            <section aria-label="Cuotas pendientes">
              <h3 className="text-xs font-bold uppercase tracking-wide text-texto-suave">Pendientes</h3>
              {datos.pendientes.length === 0 ? (
                <p className="text-sm text-texto-suave py-3">No tenés cuotas pendientes.</p>
              ) : (
                <ul className="flex flex-col divide-y divide-gray-800">
                  {datos.pendientes.map((c) => <FilaCuota key={c.id} cuota={c} onAbrir={setAbierta} onPagar={pagar} />)}
                </ul>
              )}
            </section>

            <section aria-label="Historial de pagos">
              <h3 className="text-xs font-bold uppercase tracking-wide text-texto-suave">Historial de pagos</h3>
              {historial.length === 0 ? (
                <p className="text-sm text-texto-suave py-3">Todavía no registraste pagos de cuotas.</p>
              ) : (
                <>
                  <ul className="flex flex-col divide-y divide-gray-800">
                    {(verTodo ? historial : historial.slice(0, HISTORIAL_VISIBLE)).map((c) => (
                      <FilaCuota key={c.id} cuota={c} onAbrir={setAbierta} onPagar={pagar} />
                    ))}
                  </ul>
                  {historial.length > HISTORIAL_VISIBLE && (
                    <button type="button" onClick={() => setVerTodo((v) => !v)} className="text-sm font-semibold text-viper hover:underline cursor-pointer mt-1">
                      {verTodo ? 'Ver menos' : `Ver los ${historial.length} pagos`}
                    </button>
                  )}
                </>
              )}
            </section>
          </div>
        )}
      </BloquePortal>
      {abierta && <DetalleCuota cuota={abierta} onCerrar={() => setAbierta(null)} onPagar={pagar} />}
    </>
  )
}