import EstadoBadge from '../../../../shared/components/EstadoBadge'
import { nombreMes } from '../../calendario/calendario'
import { fechaCompleta, precio } from '../../torneos/torneos'
import { estadoDeCuota } from '../socios'

// Últimas cuotas del socio (las trae GET /socios/:id en `ultimasCuotas`, de la más nueva a la más vieja)
export default function CuotasDelSocio({ cuotas }) {
  return (
    <section aria-labelledby="titulo-cuotas" className="bg-panel border border-gray-800 rounded-2xl p-6">
      <h2 id="titulo-cuotas" className="text-xs font-bold uppercase tracking-wide text-texto-suave mb-2">
        Últimas cuotas
      </h2>
      {cuotas.length === 0 ? (
        <p className="text-sm text-texto-suave py-4">Todavía no tiene cuotas generadas.</p>
      ) : (
        <ul>
          {cuotas.map((cuota) => (
            <li key={cuota.id} className="flex items-center justify-between gap-3 py-3 border-b border-gray-800 last:border-0">
              <div className="min-w-0">
                <p className="text-sm font-medium">{nombreMes(`${cuota.anio}-${String(cuota.mes).padStart(2, '0')}`)}</p>
                <p className="text-xs text-texto-suave">Vence {fechaCompleta(cuota.fechaVencimiento)}</p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-sm tabular-nums">{precio(Number(cuota.monto))}</span>
                <EstadoBadge tipo="cuota" estado={estadoDeCuota(cuota)} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}