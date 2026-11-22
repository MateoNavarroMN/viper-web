import { fechaPartido } from '../../torneos/torneos'
import { etapaDelPartido } from '../portal'
import { usePortal } from '../usePortal'
import BloquePortal from './BloquePortal'

// Bloque «Próximos partidos»: los partidos programados del jugador (o de su pareja), del más cercano al más lejano.
export default function ProximosPartidos() {
  const portal = usePortal('/portal/partidos')
  const partidos = portal.datos?.partidos ?? []

  return (
    <BloquePortal
      titulo="Próximos partidos"
      estado={portal}
      vacio={portal.datos && partidos.length === 0 ? 'No tenés partidos programados por ahora. Cuando el club programe uno, lo vas a ver acá.' : null}
    >
      <ul className="flex flex-col divide-y divide-gray-800">
        {partidos.map((p) => (
          <li key={p.id} className="py-3 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
            <div className="sm:w-44 shrink-0">
              <p className="text-sm font-semibold tabular-nums">{fechaPartido(p.fecha, p.horaInicio)}</p>
              <p className="text-xs text-texto-suave break-words">{p.cancha} · hasta las {p.horaFin}</p>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm break-words">
                <span className="text-texto-suave">vs. </span>
                {p.rival ?? <span className="text-texto-suave">Rival por definir</span>}
              </p>
              <p className="text-xs text-texto-suave break-words">{p.torneo.nombre} · {etapaDelPartido(p)}</p>
            </div>
          </li>
        ))}
      </ul>
    </BloquePortal>
  )
}