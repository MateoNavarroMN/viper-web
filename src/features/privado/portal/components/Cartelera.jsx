import { useState } from 'react'
import EstadoBadge from '../../../../shared/components/EstadoBadge'
import { haceCuanto } from '../portal'
import { usePortal } from '../usePortal'
import BloquePortal from './BloquePortal'
import DetalleNovedad from './DetalleNovedad'

// Cartelera de comunicados. `limite` = cuántos muestra; con `verTodas` agrega el enlace a la pantalla completa.
export function ListaNovedades({ comunicados, onAbrir }) {
  return (
    <ul className="flex flex-col divide-y divide-gray-800">
      {comunicados.map((c) => (
        <li key={c.id}>
          <button
            type="button"
            onClick={() => onAbrir(c.id)}
            className="w-full text-left py-3 flex items-start gap-3 cursor-pointer hover:bg-fondo/50 rounded-lg px-2 -mx-2 transition-colors focus-visible:outline-2 focus-visible:outline-viper"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold break-words">{c.titulo}</p>
              <p className="text-xs text-texto-suave mt-1">Publicado · {haceCuanto(c.fechaPublicacion)}</p>
              <p className="text-sm text-texto-suave mt-1 break-words line-clamp-2">{c.extracto}{c.hayMas ? '…' : ''}</p>
            </div>
            <div className="shrink-0"><EstadoBadge tipo="alcanceComunicado" estado={c.alcance} /></div>
          </button>
        </li>
      ))}
    </ul>
  )
}

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
        vacio={datos?.comunicados.length === 0 ? 'Por ahora no hay novedades del club.' : null}
      >
        {datos && <ListaNovedades comunicados={datos.comunicados} onAbrir={setAbierto} />}
      </BloquePortal>
      {abierto && <DetalleNovedad id={abierto} onCerrar={() => setAbierto(null)} />}
    </>
  )
}