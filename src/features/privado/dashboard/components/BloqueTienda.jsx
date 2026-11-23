import Badge from '../../../../shared/components/Badge'
import { useConsulta } from '../useConsulta'
import { dinero, rangoEscrito } from '../dashboard'
import BloqueOperativo, { AvisoDeBloque } from './BloqueOperativo'

const VISIBLES = 5

// Lista de productos con poco stock bajo una insignia («Sin stock» / «Stock bajo»)
function ListaDeStock({ variante, titulo, productos, detalle }) {
  if (productos.length === 0) return null
  return (
    <div className="flex flex-col gap-1">
      <div><Badge variante={variante}>{titulo}</Badge></div>
      <ul className="text-sm flex flex-col gap-1 mt-1">
        {productos.slice(0, VISIBLES).map((p) => <li key={p.id}>{p.nombre}{detalle?.(p)}</li>)}
      </ul>
      {productos.length > VISIBLES && <p className="text-sm text-texto-suave">y {productos.length - VISIBLES} más</p>}
    </div>
  )
}

// Tienda: ventas del período que se está mirando en el panel, productos más vendidos y productos con stock agotado o bajo.
export default function BloqueTienda({ desde, hasta }) {
  const parametros = new URLSearchParams()
  if (desde) parametros.set('desde', desde)
  if (hasta) parametros.set('hasta', hasta)
  const consulta = useConsulta(`/dashboard/tienda${parametros.size ? `?${parametros}` : ''}`)

  return (
    <BloqueOperativo titulo="Tienda" ruta="/gestion/tienda" consulta={consulta}>
      {(d) => {
        const hayStock = d.stock.agotados.length + d.stock.bajos.length > 0
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex flex-col gap-3 min-w-0">
              <div>
                <p className="text-sm text-texto-suave">Ventas del período · {rangoEscrito(d.desde, d.hasta)}</p>
                <p className="font-outfit text-2xl font-bold text-exito tabular-nums whitespace-nowrap">{dinero(d.ventas.monto)}</p>
              </div>
              {/* 9a: período sin ventas */}
              {d.ventas.sinVentas ? (
                <AvisoDeBloque>No hubo ventas en el período</AvisoDeBloque>
              ) : (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-texto-suave mb-2">Más vendidos</p>
                  <ul className="flex flex-col gap-1 text-sm">
                    {d.masVendidos.map((p) => (
                      <li key={p.productoId} className="flex justify-between gap-3">
                        <span className="min-w-0 break-words">{p.nombre}</span>
                        <span className="text-texto-suave tabular-nums whitespace-nowrap">{p.unidades} u.</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-4 sm:border-l sm:border-gray-800 sm:pl-6 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-texto-suave">Stock</p>
              {hayStock ? (
                <>
                  <ListaDeStock variante="error" titulo="Sin stock" productos={d.stock.agotados} />
                  <ListaDeStock variante="advertencia" titulo="Stock bajo" productos={d.stock.bajos} detalle={(p) => ` · ${p.stockActual} u.`} />
                </>
              ) : (
                <AvisoDeBloque>Ningún producto con stock agotado o bajo</AvisoDeBloque>
              )}
            </div>
          </div>
        )
      }}
    </BloqueOperativo>
  )
}