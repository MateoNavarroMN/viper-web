import { useState } from 'react'
import EstadoBadge from '../../../../shared/components/EstadoBadge'
import { haceCuanto } from '../portal'
import { usePortal } from '../usePortal'
import BloquePortal from './BloquePortal'
import DetalleNovedad from './DetalleNovedad'

// Lista de comunicados de la cartelera: un renglón por aviso con su título, hace cuánto se publicó, a quién va dirigido y una flecha.
// Al tocar uno se pide a quien la usa que abra el texto completo (`onAbrir`).
export function ListaNovedades({ comunicados, onAbrir }) {
  return (
    <ul className="flex flex-col divide-y divide-gray-800">
      {comunicados.map((c) => (
        <li key={c.id}>
          <button
            type="button"
            onClick={() => onAbrir(c.id)}
            className="w-full text-left py-3 flex items-center gap-3 cursor-pointer hover:bg-fondo/50 rounded-lg px-2 -mx-2 transition-colors focus-visible:outline-2 focus-visible:outline-viper"
          >
            <span className="shrink-0 w-9 h-9 rounded-full bg-viper/15 text-viper flex items-center justify-center" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z M15.5 8.5a5 5 0 0 1 0 7" />
              </svg>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold break-words">{c.titulo}</span>
              <span className="block text-xs text-texto-suave mt-0.5">Publicado · {haceCuanto(c.fechaPublicacion)}</span>
            </span>
            <span className="shrink-0"><EstadoBadge tipo="alcanceComunicado" estado={c.alcance} /></span>
            <span aria-hidden="true" className="shrink-0 text-texto-suave">›</span>
          </button>
        </li>
      ))}
    </ul>
  )
}

// Bloque «Novedades del club». `limite` = cuántos muestra; con `verTodas` agrega el enlace a la pantalla completa.
export default function Cartelera({ limite = 3, verTodas = true }) {
  const portal = usePortal(`/portal/comunicados?limite=${limite}`)
  const [abierto, setAbierto] = useState(null)
  const { datos } = portal

  return (
    <>
      <BloquePortal
        titulo="Novedades del club"
        enlace={verTodas && datos?.total > 0 ? { texto: 'Ver todas', to: '/portal/novedades' } : null}
        estado={portal}
        vacio={datos?.comunicados.length === 0 ? { titulo: 'No hay novedades por ahora', detalle: 'Cuando el club publique un aviso, lo vas a ver acá.' } : null}
      >
        {datos && <ListaNovedades comunicados={datos.comunicados} onAbrir={setAbierto} />}
      </BloquePortal>
      {abierto && <DetalleNovedad id={abierto} onCerrar={() => setAbierto(null)} />}
    </>
  )
}