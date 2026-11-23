import { ETIQUETA_RUBRO, dineroCorto } from '../dashboard'
import BloqueBalance from './BloqueBalance'

// «Ingresos por rubro» o «Egresos por rubro»: una barra por rubro, proporcional al mayor. Solo lista los rubros con importe.
//   campo = 'ingresos' | 'egresos' · rubrosPosibles = los rubros que pueden tener ese tipo de movimiento · color = clase bg- de la barra
//   onElegir(rubro) = al elegir un rubro se abre el detalle de sus movimientos
export default function DesglosePorRubro({ titulo, campo, porRubro, rubrosPosibles, color, onElegir }) {
  const filas = porRubro
    .filter((r) => rubrosPosibles.includes(r.rubro) && r[campo] > 0)
    .sort((a, b) => b[campo] - a[campo])
  const mayor = filas[0]?.[campo] ?? 0

  return (
    <BloqueBalance titulo={titulo}>
      {filas.length === 0 ? (
        <p className="text-sm text-texto-suave text-center py-6">{campo === 'ingresos' ? 'No hay ingresos en el período.' : 'No hay egresos en el período.'}</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {filas.map((fila) => (
            <li key={fila.rubro}>
              <button
                type="button"
                onClick={() => onElegir(fila.rubro)}
                aria-label={`Ver los movimientos de ${ETIQUETA_RUBRO[fila.rubro]}`}
                className="w-full text-left rounded-lg -mx-2 px-2 py-1 hover:bg-fondo/60 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-viper"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span>{ETIQUETA_RUBRO[fila.rubro]}</span>
                  <span className="font-semibold tabular-nums">{dineroCorto(fila[campo])}</span>
                </div>
                <div className="h-2 rounded-full bg-gray-800 mt-2 overflow-hidden" role="presentation">
                  <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(2, (fila[campo] / mayor) * 100)}%` }} />
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
      {filas.length > 0 && <p className="text-xs text-texto-suave mt-5">Seleccioná un rubro para ver sus movimientos</p>}
    </BloqueBalance>
  )
}