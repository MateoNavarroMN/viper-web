import { fechaPartido } from '../../torneos/torneos'
import { etapaDelPartido } from '../portal'
import { usePortal } from '../usePortal'
import BloquePortal from './BloquePortal'

// Bloque «Próximos partidos»: los partidos programados del jugador (o de su pareja), del más cercano al más lejano.
// Cada uno es una tarjeta: cuándo se juega y en qué cancha, contra quién, y el torneo con su zona o instancia.
export default function ProximosPartidos() {
  const portal = usePortal('/portal/partidos')
  const partidos = portal.datos?.partidos ?? []

  return (
    <BloquePortal
      titulo="Próximos partidos"
      estado={portal}
      vacio={portal.datos && partidos.length === 0 ? { titulo: 'No tenés partidos programados', detalle: 'Cuando se programe uno, lo vas a ver acá.' } : null}
    >
      <ul className="flex flex-col gap-3">
        {partidos.map((p) => (
          <li key={p.id} className="bg-fondo border border-gray-800 rounded-xl px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold tabular-nums">{fechaPartido(p.fecha, p.horaInicio)}</p>
              <p className="text-sm font-semibold text-viper text-right break-words">{p.cancha}</p>
            </div>
            <p className="text-sm mt-1 break-words">
              <span className="text-texto-suave">vs. </span>
              {p.rival ?? <span className="text-texto-suave">Rival por definir</span>}
            </p>
            <p className="text-xs text-texto-suave mt-1 break-words">{p.torneo.nombre} · {etapaDelPartido(p)}</p>
          </li>
        ))}
      </ul>
    </BloquePortal>
  )
}