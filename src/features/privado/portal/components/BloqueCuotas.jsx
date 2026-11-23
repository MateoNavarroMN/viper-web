import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../../../shared/components/Button'
import EstadoBadge from '../../../../shared/components/EstadoBadge'
import Modal from '../../../../shared/components/Modal'
import { estadoDeCuota, fechaDePago, nombrePeriodo } from '../../socios/socios'
import { escribirPrecio, fechaCompleta } from '../../torneos/torneos'
import { usePortal } from '../usePortal'
import Aviso from './Aviso'
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
    <li className="py-3 flex flex-col gap-2">
      <button
        type="button"
        onClick={() => onAbrir(cuota)}
        className="w-full text-left cursor-pointer hover:text-viper transition-colors focus-visible:outline-2 focus-visible:outline-viper rounded flex items-start justify-between gap-3"
      >
        <span className="min-w-0">
          <span className="block text-sm break-words">{nombrePeriodo(cuota.mes, cuota.anio)}</span>
          <span className="block text-xs text-texto-suave break-words">{detalleDeFila(cuota, estado)}</span>
        </span>
        <span className="text-sm tabular-nums whitespace-nowrap">$ {escribirPrecio(Number(cuota.monto))}</span>
      </button>
      <div className="flex flex-wrap items-center justify-between gap-2">
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

// Bloque «Mis cuotas»: solo para socios. Arriba, el estado (Al día / Adeudado); si debe, el monto adeudado en grande; después las cuotas
// pendientes (cada una con su «Pagar en línea») y el historial de pagos. Quien no es socio ve cómo asociarse en lugar de las cuotas.
export default function BloqueCuotas() {
  const portal = usePortal('/portal/cuotas')
  const navigate = useNavigate()
  const [abierta, setAbierta] = useState(null)
  const [verTodo, setVerTodo] = useState(false)
  const { datos } = portal
  const historial = datos?.historial ?? []
  const pagar = (cuota) => irAPagar(navigate, cuota)
  const vencidas = datos?.pendientes?.filter((c) => estadoDeCuota(c) === 'VENCIDA').length ?? 0

  return (
    <>
      <BloquePortal
        titulo="Mis cuotas"
        estado={portal}
      >
        {datos && !datos.esSocio && (
          <div className="bg-fondo border border-gray-800 rounded-xl p-4 flex flex-col gap-1">
            <p className="font-outfit font-bold">Asociate al club</p>
            <p className="text-sm text-texto-suave">
              Como socio accedés a tarifas especiales, ves tus cuotas y tu historial de pagos desde el portal. Para asociarte, acercate a recepción.
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
              <div className="bg-fondo border border-error/40 rounded-xl p-4">
                <p className="text-sm text-texto-suave">Monto adeudado</p>
                <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-1">
                  <p className="font-outfit text-2xl font-bold text-error tabular-nums whitespace-nowrap">$ {escribirPrecio(datos.montoAdeudado)}</p>
                  <p className="text-sm text-texto-suave">{vencidas} {vencidas === 1 ? 'cuota vencida' : 'cuotas vencidas'}</p>
                </div>
              </div>
            )}

            <section aria-label="Próxima cuota">
              <h3 className="text-xs font-bold uppercase tracking-wide text-texto-suave">{datos.pendientes.length > 1 ? 'Cuotas pendientes' : 'Próxima cuota'}</h3>
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
                <div className="mt-2"><Aviso titulo="Todavía no registraste pagos" /></div>
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