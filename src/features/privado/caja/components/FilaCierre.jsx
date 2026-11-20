import EstadoBadge from '../../../../shared/components/EstadoBadge'
import { diaConNombre, diferenciaConSigno, importe } from '../caja'

export const COLUMNAS_CIERRE = 'md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_9rem_8rem_8rem]'

// Un cierre del historial. Toda la fila abre el detalle. En el celular es una tarjeta: fecha y estado arriba, importes debajo.
export default function FilaCierre({ cierre, onAbrir }) {
  const descuadrado = cierre.diferencia !== 0
  return (
    <li>
      <button
        type="button"
        onClick={() => onAbrir(cierre.id)}
        aria-label={`Ver el cierre del ${diaConNombre(cierre.fecha)}`}
        className={`w-full text-left grid grid-cols-[minmax(0,1fr)_auto] ${COLUMNAS_CIERRE} items-center gap-x-4 gap-y-1 bg-panel border border-gray-800 hover:border-viper focus-visible:outline-2 focus-visible:outline-viper rounded-xl px-4 md:px-6 py-3 transition-colors cursor-pointer`}
      >
        <span className="min-w-0 order-1 md:order-none">
          <span className="block text-sm font-semibold">{diaConNombre(cierre.fecha)}</span>
          <span className="block text-xs text-texto-suave">
            {cierre.cantidadMovimientos} {cierre.cantidadMovimientos === 1 ? 'movimiento' : 'movimientos'}
          </span>
        </span>
        <span className="hidden md:block text-sm truncate">{cierre.responsable}</span>
        <span className="order-3 md:order-none col-span-2 md:col-span-1 text-sm tabular-nums text-texto-suave md:text-texto md:text-right">
          <span className="md:hidden">Declarado </span>
          {importe(cierre.efectivoDeclarado)}
        </span>
        <span className={`order-4 md:order-none col-span-2 md:col-span-1 text-sm tabular-nums md:text-right ${descuadrado ? 'text-error' : 'text-texto-suave md:text-texto'}`}>
          <span className="md:hidden">Diferencia </span>
          {diferenciaConSigno(cierre.diferencia)}
        </span>
        <span className="order-2 md:order-none md:text-right md:justify-self-end">
          <EstadoBadge tipo="cierre" estado={cierre.estado} />
        </span>
      </button>
    </li>
  )
}