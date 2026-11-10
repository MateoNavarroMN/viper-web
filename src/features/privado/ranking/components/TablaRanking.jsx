import { Link, useNavigate } from 'react-router-dom'
import Badge from '../../../../shared/components/Badge'
import { nombreCompleto, rutaDetalle } from '../ranking'

const claseFila = (propia) => (propia ? 'bg-viper/10' : '')
const clasePuesto = (posicion) => `font-outfit font-bold tabular-nums ${posicion === 1 ? 'text-viper' : 'text-texto-suave'}`

function Nombre({ fila, propia, disciplina }) {
  return (
    <span className="flex items-center gap-2 min-w-0">
      <Link
        to={rutaDetalle(disciplina, fila.jugador.id)}
        className={`truncate hover:text-viper hover:underline focus-visible:outline-2 focus-visible:outline-viper rounded ${propia ? 'font-semibold' : ''}`}
      >
        {nombreCompleto(fila.jugador)}
      </Link>
      {propia && <Badge variante="exito">Vos</Badge>}
    </span>
  )
}

export default function TablaRanking({ filas, jugadorId, disciplina }) {
  const navigate = useNavigate()
  const esPropia = (fila) => jugadorId != null && fila.jugador.id === jugadorId
  const abrir = (e, fila) => {
    if (!e.target.closest('a')) navigate(rutaDetalle(disciplina, fila.jugador.id))
  }

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
                <tr key={fila.jugador.id} aria-current={propia || undefined} onClick={(e) => abrir(e, fila)} className={`border-b border-gray-800 last:border-b-0 cursor-pointer hover:bg-fondo/50 ${claseFila(propia)}`}>
                  <td className={`px-6 py-4 ${clasePuesto(fila.posicion)}`}>{fila.posicion}°</td>
                  <td className="px-6 py-4"><Nombre fila={fila} propia={propia} disciplina={disciplina} /></td>
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
            <li key={fila.jugador.id} aria-current={propia || undefined} onClick={(e) => abrir(e, fila)} className={`flex items-center gap-3 px-4 py-3 border-b border-gray-800 last:border-b-0 cursor-pointer ${claseFila(propia)}`}>
              <span className={`w-9 shrink-0 text-lg ${clasePuesto(fila.posicion)}`}>{fila.posicion}°</span>
              <div className="flex-1 min-w-0">
                <Nombre fila={fila} propia={propia} disciplina={disciplina} />
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