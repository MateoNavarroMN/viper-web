import { COLOR_MEDIO, ETIQUETA_MEDIO, dineroCorto } from '../dashboard'
import BloqueBalance from './BloqueBalance'

// «Ingresos por medio de pago»: una barra apilada con la proporción de cada medio y, debajo, el importe y el porcentaje de cada uno.
// Cada medio lleva su nombre escrito: el color solo no alcanza para distinguirlos.
export default function DesglosePorMedio({ porMedio }) {
  const total = porMedio.reduce((suma, m) => suma + m.ingresos, 0)

  return (
    <BloqueBalance titulo="Ingresos por medio de pago">
      {total <= 0 ? (
        <p className="text-sm text-texto-suave text-center py-6">No hay ingresos en el período.</p>
      ) : (
        <>
          <div className="flex h-3 rounded-full overflow-hidden gap-0.5" role="presentation">
            {porMedio
              .filter((m) => m.ingresos > 0)
              .map((m) => (
                <div key={m.medio} className={COLOR_MEDIO[m.medio]} style={{ width: `${(m.ingresos / total) * 100}%` }} />
              ))}
          </div>
          <ul className="flex flex-col gap-3 mt-5">
            {porMedio.map((m) => (
              <li key={m.medio} className="flex items-center gap-3">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${COLOR_MEDIO[m.medio]}`} aria-hidden="true" />
                <span className="flex-1 min-w-0">{ETIQUETA_MEDIO[m.medio]}</span>
                <span className="font-semibold tabular-nums">{dineroCorto(m.ingresos)}</span>
                <span className="text-sm text-texto-suave tabular-nums w-12 text-right">{Math.round((m.ingresos / total) * 100)} %</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </BloqueBalance>
  )
}