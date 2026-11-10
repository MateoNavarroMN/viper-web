import Badge from '../../../../shared/components/Badge'
import { nombreInstancia } from '../reglas'

const FORMATO = new Intl.NumberFormat('es-AR')

// '2026-11-05T15:00:00.000Z' → '05/11/2026' (hora de Córdoba). Un movimiento sin fecha (puntos de partida) → '—'.
const fecha = (iso) =>
  iso ? new Date(iso).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Cordoba', day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'

// 'AJUSTE' es el movimiento que no viene de un partido (ajuste de categoría de un socio o puntos de partida)
const instancia = (movimiento) => (movimiento.instancia === 'AJUSTE' ? 'Ajuste' : nombreInstancia(movimiento.instancia))

// «Torneo Apertura» y, abajo, «vs Luis Ríos / Ana Gómez»; sin partido, de dónde vienen los puntos
const origen = (movimiento) => {
  if (!movimiento.partido) {
    if (movimiento.instancia !== 'AJUSTE') return { principal: 'Partido eliminado', detalle: '' }
    return { principal: movimiento.fecha ? 'Ajuste de puntos' : 'Puntos de partida', detalle: '' }
  }
  const rivales = movimiento.partido.rivales.map((r) => `${r.nombre} ${r.apellido}`).join(' / ')
  return { principal: movimiento.partido.torneo.nombre, detalle: rivales ? `vs ${rivales}` : '' }
}

const puntos = (movimiento) => `${movimiento.puntos > 0 ? '+' : ''}${FORMATO.format(movimiento.puntos)}`

const clasePuntos = (movimiento) =>
  movimiento.revertido ? 'line-through text-texto-suave' : movimiento.puntos < 0 ? 'text-error' : 'text-viper'

const Estado = ({ movimiento }) =>
  movimiento.revertido ? <Badge variante="advertencia">Revertido</Badge> : <Badge variante="exito">Vigente</Badge>

const clave = (movimiento) => movimiento.id ?? 'puntos-de-partida'

export default function HistorialPuntos({ movimientos }) {
  return (
    <>
      <div className="hidden md:block bg-panel border border-gray-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-800 text-texto-suave">
              <th scope="col" className="text-xs font-semibold uppercase tracking-wide px-6 py-4">Fecha</th>
              <th scope="col" className="text-xs font-semibold uppercase tracking-wide px-6 py-4">Instancia</th>
              <th scope="col" className="text-xs font-semibold uppercase tracking-wide px-6 py-4">Partido / Torneo</th>
              <th scope="col" className="text-xs font-semibold uppercase tracking-wide px-6 py-4 text-right">Puntos</th>
              <th scope="col" className="text-xs font-semibold uppercase tracking-wide px-6 py-4">Estado</th>
            </tr>
          </thead>
          <tbody>
            {movimientos.map((m) => {
              const { principal, detalle } = origen(m)
              return (
                <tr key={clave(m)} className={`border-b border-gray-800 last:border-b-0 ${m.revertido ? 'text-texto-suave' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap tabular-nums">{fecha(m.fecha)}</td>
                  <td className="px-6 py-4">{instancia(m)}</td>
                  <td className="px-6 py-4">
                    <p>{principal}</p>
                    {detalle && <p className="text-xs text-texto-suave">{detalle}</p>}
                  </td>
                  <td className={`px-6 py-4 text-right font-outfit font-bold tabular-nums ${clasePuntos(m)}`}>{puntos(m)}</td>
                  <td className="px-6 py-4">
                    <Estado movimiento={m} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <ul className="md:hidden flex flex-col gap-3">
        {movimientos.map((m) => {
          const { principal, detalle } = origen(m)
          return (
            <li key={clave(m)} className={`bg-panel border border-gray-800 rounded-2xl p-4 ${m.revertido ? 'text-texto-suave' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium break-words min-w-0">{instancia(m)}</p>
                <p className={`font-outfit font-bold tabular-nums whitespace-nowrap ${clasePuntos(m)}`}>{puntos(m)}</p>
              </div>
              <p className="text-xs text-texto-suave mt-1 break-words">
                {fecha(m.fecha)} · {principal}
                {detalle && ` · ${detalle}`}
              </p>
              <div className="mt-2">
                <Estado movimiento={m} />
              </div>
            </li>
          )
        })}
      </ul>
    </>
  )
}