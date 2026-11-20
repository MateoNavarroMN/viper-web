import EstadoBadge from '../../../../shared/components/EstadoBadge'
import { ETIQUETA_CONCEPTO, ETIQUETA_METODO_PAGO, horaDelMovimiento, importeConSigno } from '../caja'

export const COLUMNAS_MOVIMIENTO = 'md:grid-cols-[3.5rem_minmax(0,1fr)_8rem_6.5rem_9rem]'

// Un movimiento del listado. Toda la fila abre el detalle. Un movimiento anulado se ve tachado y con su estado.
// En el celular es una tarjeta: concepto e importe arriba, la descripción y, debajo, hora, medio de pago y estado.
export default function FilaMovimiento({ movimiento, onAbrir }) {
  const anulado = movimiento.estado === 'ANULADO'
  const sinEfecto = movimiento.estado !== 'APROBADO'
  const colorMonto = sinEfecto ? 'text-texto-suave' : movimiento.tipo === 'INGRESO' ? 'text-exito' : 'text-error'
  const detalle = [movimiento.descripcion, movimiento.cliente].filter(Boolean).join(' · ')

  return (
    <li>
      <button
        type="button"
        onClick={() => onAbrir(movimiento.id)}
        aria-label={`Ver el detalle: ${ETIQUETA_CONCEPTO[movimiento.concepto]}, ${importeConSigno(movimiento)}${anulado ? ', anulado' : ''}`}
        className={`w-full text-left grid grid-cols-[minmax(0,1fr)_auto] ${COLUMNAS_MOVIMIENTO} items-center gap-x-4 gap-y-1 bg-panel border border-gray-800 hover:border-viper focus-visible:outline-2 focus-visible:outline-viper rounded-xl px-4 md:px-6 py-3 transition-colors cursor-pointer`}
      >
        <span className="hidden md:block text-sm tabular-nums text-texto-suave">{horaDelMovimiento(movimiento.fechaHora)}</span>

        <span className="min-w-0 order-1 md:order-none">
          <span className={`block text-sm font-semibold truncate ${anulado ? 'line-through text-texto-suave' : ''}`}>{ETIQUETA_CONCEPTO[movimiento.concepto]}</span>
          {detalle && <span className={`block text-xs text-texto-suave truncate ${anulado ? 'line-through' : ''}`}>{detalle}</span>}
        </span>

        <span className="hidden md:block text-sm truncate">{ETIQUETA_METODO_PAGO[movimiento.metodoPago]}</span>
        <span className="hidden md:block">
          <EstadoBadge tipo="movimiento" estado={movimiento.estado} />
        </span>
        <span className={`order-2 md:order-none text-sm font-semibold tabular-nums text-right ${colorMonto} ${anulado ? 'line-through' : ''}`}>{importeConSigno(movimiento)}</span>

        <span className="md:hidden order-3 col-span-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-texto-suave">
          <span className="tabular-nums">{horaDelMovimiento(movimiento.fechaHora)}</span>
          <span>{ETIQUETA_METODO_PAGO[movimiento.metodoPago]}</span>
          <EstadoBadge tipo="movimiento" estado={movimiento.estado} />
        </span>
      </button>
    </li>
  )
}