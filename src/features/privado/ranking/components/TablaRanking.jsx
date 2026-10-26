import Badge from '../../../../shared/components/Badge'
import { nombreCompleto } from '../ranking'

const claseFila = (propia) => (propia ? 'bg-viper/10' : '')
const clasePuesto = (posicion) => `font-outfit font-bold tabular-nums ${posicion === 1 ? 'text-viper' : 'text-texto-suave'}`

function Nombre({ fila, propia }) {
  return (
    <span className="flex items-center gap-2 min-w-0">
      <span className={`truncate ${propia ? 'font-semibold' : ''}`}>{nombreCompleto(fila.jugador)}</span>
      {propia && <Badge variante="exito">Vos</Badge>}
    </span>
  )
}

// Lista del ranking: tabla desde `md` y filas apiladas en el celular. Los empatados comparten posición.
//   filas:     [{ posicion, jugador: { id, nombre, apellido }, puntos, categoria: { id, nombre } }]
//   jugadorId: `usuario.jugador_id` de quien mira (null para el personal); resalta su fila.
export default function TablaRanking({ filas, jugadorId }) {
  const esPropia = (fila) => jugadorId != null && fila.jugador.id === jugadorId

  return (
    <>
      <div className="hidden md:block bg-panel border border-gray-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-800 text-texto-suave">
              <th scope="col" className="text-xs font-semibold uppercase tracking-wide px-6 py-4 w-24">Puesto</th>
              <th scope="col" className="text-xs font-semibold uppercase tracking-wide px-6 py-4">Jugador</th>
              <th scope="col" className="text-xs font-semibold uppercase tracking-wide px-6 py-4">Categoría</th>
              <th scope="col" className="text-xs font-semibold uppercase tracking-wide px-6 py-4 text-right">Puntos</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((fila) => {
              const propia = esPropia(fila)
              return (
                <tr key={fila.jugador.id} aria-current={propia || undefined} className={`border-b border-gray-800 last:border-b-0 ${claseFila(propia)}`}>
                  <td className={`px-6 py-4 ${clasePuesto(fila.posicion)}`}>{fila.posicion}°</td>
                  <td className="px-6 py-4"><Nombre fila={fila} propia={propia} /></td>
                  <td className="px-6 py-4 text-texto-suave">{fila.categoria.nombre}</td>
                  <td className="px-6 py-4 text-right font-outfit font-bold tabular-nums">{fila.puntos}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <ul className="md:hidden bg-panel border border-gray-800 rounded-2xl overflow-hidden">
        {filas.map((fila) => {
          const propia = esPropia(fila)
          return (
            <li key={fila.jugador.id} aria-current={propia || undefined} className={`flex items-center gap-3 px-4 py-3 border-b border-gray-800 last:border-b-0 ${claseFila(propia)}`}>
              <span className={`w-9 shrink-0 text-lg ${clasePuesto(fila.posicion)}`}>{fila.posicion}°</span>
              <div className="flex-1 min-w-0">
                <Nombre fila={fila} propia={propia} />
                <p className="text-xs text-texto-suave truncate">{fila.categoria.nombre}</p>
              </div>
              <span className="shrink-0 text-right font-outfit font-bold tabular-nums">
                {fila.puntos}
                <span className="block text-[11px] font-normal text-texto-suave">pts</span>
              </span>
            </li>
          )
        })}
      </ul>
    </>
  )
}