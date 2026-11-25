import { precio } from '../../torneos/torneos'
import { ETIQUETA_CATEGORIA, STOCK_BAJO, claseStock, textoStock } from '../tienda'
import ImagenProducto from './ImagenProducto'

// Un producto de la grilla del punto de venta. Al tocarlo se suma una unidad al carrito.
// Sin stock se ve atenuado, dice «Sin stock» y no se puede agregar.
// La cantidad que ya está en la venta va en un círculo verde a la derecha, como parte de la fila (no flota encima del stock).
export default function ProductoVenta({ producto, enCarrito, onAgregar }) {
  const sinStock = producto.sinStock
  return (
    <li>
      <button
        type="button"
        onClick={() => onAgregar(producto)}
        disabled={sinStock}
        aria-label={sinStock ? `${producto.nombre}: sin stock` : `Agregar ${producto.nombre} a la venta`}
        className={`w-full text-left flex items-center gap-3 bg-panel border border-gray-800 rounded-xl p-3 transition-colors ${
          sinStock ? 'opacity-60 cursor-not-allowed' : 'hover:border-viper cursor-pointer focus-visible:outline-2 focus-visible:outline-viper'
        }`}
      >
        <ImagenProducto key={producto.imagenUrl ?? 'sin-imagen'} url={producto.imagenUrl} className="w-14 h-14" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold line-clamp-2 break-words">{producto.nombre}</span>
          <span className="block text-xs text-texto-suave">{ETIQUETA_CATEGORIA[producto.categoria]}</span>
          <span className="flex flex-wrap items-baseline gap-x-3 mt-1">
            <span className="text-sm tabular-nums">{precio(producto.precio)}</span>
            <span className={`text-xs tabular-nums ${claseStock(producto.stockActual)} ${producto.stockActual > STOCK_BAJO ? 'text-texto-suave' : ''}`}>
              {sinStock ? textoStock(0) : `Stock: ${textoStock(producto.stockActual)}`}
            </span>
          </span>
        </span>
        {enCarrito > 0 && (
          <span className="shrink-0 min-w-6 h-6 px-1.5 rounded-full bg-viper text-sobre-viper text-xs font-bold flex items-center justify-center tabular-nums" aria-label={`${enCarrito} en la venta`}>
            {enCarrito}
          </span>
        )}
      </button>
    </li>
  )
}