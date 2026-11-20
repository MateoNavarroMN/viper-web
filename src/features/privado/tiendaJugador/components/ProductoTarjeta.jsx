import Badge from '../../../../shared/components/Badge'
import { precio } from '../../torneos/torneos'
import { ETIQUETA_CATEGORIA } from '../../tienda/tienda'
import ImagenProducto from '../../tienda/components/ImagenProducto'

// Un producto de la tienda del Jugador. Sin stock se ve atenuado y lo dice, pero sigue a la vista.
// (El detalle del producto se abre desde acá en M5-FE-07.)
export default function ProductoTarjeta({ producto }) {
  const sinStock = !producto.disponible
  return (
    <li>
      <article className={`h-full flex flex-col gap-3 bg-panel border border-gray-800 rounded-2xl p-3 ${sinStock ? 'opacity-70' : ''}`}>
        <ImagenProducto key={producto.imagenUrl ?? 'sin-imagen'} url={producto.imagenUrl} className="w-full aspect-square" />
        <div className="flex flex-col gap-1 min-w-0 px-1 pb-1">
          <h2 className="text-sm font-semibold line-clamp-2 break-words">{producto.nombre}</h2>
          <p className="text-xs text-texto-suave">{ETIQUETA_CATEGORIA[producto.categoria]}</p>
          <p className="font-outfit text-lg font-bold tabular-nums mt-1">{precio(producto.precio)}</p>
          <div className="flex flex-wrap gap-1.5 mt-1">
            <Badge variante={sinStock ? 'error' : 'exito'}>{sinStock ? 'Sin stock' : 'Disponible'}</Badge>
            {producto.alquilable && <Badge variante="info">Alquilable</Badge>}
          </div>
        </div>
      </article>
    </li>
  )
}