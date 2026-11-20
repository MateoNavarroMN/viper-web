import Input from '../../../../shared/components/Input'
import { precio } from '../../torneos/torneos'
import ImagenProducto from './ImagenProducto'

// Una línea del carrito: foto, nombre, precio unitario, subtotal, cantidad (botones y campo) y «Quitar».
function LineaCarrito({ linea, carrito }) {
  const { sumar, escribir, soltar, quitar } = carrito
  const subtotal = Math.round(linea.precio * 100) * linea.cantidad / 100
  const idCampo = `cantidad-${linea.productoId}`
  const boton = 'w-9 h-9 shrink-0 rounded-lg border border-gray-800 bg-fondo text-lg leading-none flex items-center justify-center transition-colors hover:border-viper cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-800 focus-visible:outline-2 focus-visible:outline-viper'
  return (
    <li className="py-4 first:pt-0 last:pb-0 flex flex-col gap-2">
      <div className="flex items-start gap-3">
        <ImagenProducto key={linea.imagenUrl ?? 'sin-imagen'} url={linea.imagenUrl} className="w-10 h-10" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold break-words">{linea.nombre}</p>
          <p className="text-xs text-texto-suave tabular-nums">{precio(linea.precio)} c/u</p>
        </div>
        <p className="text-sm font-semibold tabular-nums">{precio(subtotal)}</p>
      </div>
      <div className="flex items-center gap-2 pl-[3.25rem]">
        <button type="button" className={boton} onClick={() => sumar(linea.productoId, -1)} disabled={linea.cantidad <= 1} aria-label={`Restar una unidad de ${linea.nombre}`}>
          −
        </button>
        <Input
          id={idCampo}
          aria-label={`Cantidad de ${linea.nombre}`}
          inputMode="numeric"
          autoComplete="off"
          error={Boolean(linea.error)}
          aria-describedby={linea.error ? `${idCampo}-error` : undefined}
          className="!w-16 !px-2 !py-2 text-center tabular-nums"
          value={linea.borrador}
          onChange={(e) => escribir(linea.productoId, e.target.value)}
          onBlur={() => soltar(linea.productoId)}
        />
        <button type="button" className={boton} onClick={() => sumar(linea.productoId, 1)} disabled={linea.cantidad >= linea.stock} aria-label={`Sumar una unidad de ${linea.nombre}`}>
          +
        </button>
        <button type="button" onClick={() => quitar(linea.productoId)} className="ml-auto text-xs text-texto-suave hover:text-error underline cursor-pointer">
          Quitar
        </button>
      </div>
      {linea.error && (
        <p id={`${idCampo}-error`} role="alert" className="text-error text-xs pl-[3.25rem]">
          {linea.error}
        </p>
      )}
    </li>
  )
}

// Carrito de la venta actual: las líneas y el total en vivo. `children` es el pie (medio de pago y botones, que llegan en M5-FE-05).
export default function CarritoVenta({ carrito, children }) {
  const { lineas, total, unidades } = carrito
  return (
    <section aria-label="Venta actual" className="flex flex-col gap-4">
      {lineas.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 mx-auto rounded-full bg-fondo border border-gray-800 flex items-center justify-center text-texto-suave mb-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
            </svg>
          </div>
          <p className="font-semibold">Todavía no agregaste productos</p>
          <p className="text-texto-suave text-sm mt-1">Elegí un producto de la lista para empezar la venta</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-800">
          {lineas.map((linea) => (
            <LineaCarrito key={linea.productoId} linea={linea} carrito={carrito} />
          ))}
        </ul>
      )}

      <div className="border-t border-gray-800 pt-4 flex items-baseline justify-between gap-3">
        <span className="text-sm text-texto-suave">
          Total{unidades > 0 && <span className="ml-2 text-xs">({unidades} {unidades === 1 ? 'unidad' : 'unidades'})</span>}
        </span>
        <span className="font-outfit text-2xl font-bold tabular-nums" aria-live="polite">
          {total > 0 ? precio(total) : '$ 0,00'}
        </span>
      </div>

      {children}
    </section>
  )
}