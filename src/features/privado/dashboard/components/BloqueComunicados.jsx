import { Link } from 'react-router-dom'
import EstadoBadge from '../../../../shared/components/EstadoBadge'
import { useConsulta } from '../useConsulta'
import { haceCuanto } from '../dashboard'
import BloqueOperativo, { AvisoDeBloque } from './BloqueOperativo'

// Comunicados publicados y vigentes en la cartelera (los más recientes primero).
export default function BloqueComunicados() {
  const consulta = useConsulta('/dashboard/comunicados')
  return (
    <BloqueOperativo titulo="Comunicados vigentes" ruta="/gestion/comunicados?estado=PUBLICADO" consulta={consulta}>
      {(d) => (d.comunicados.length === 0 ? (
        <AvisoDeBloque>No hay comunicados publicados. Redactá uno desde Comunicados.</AvisoDeBloque>
      ) : (
        <>
          <ul className="flex flex-col divide-y divide-gray-800 -my-3">
            {d.comunicados.map((c) => (
              <li key={c.id} className="py-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link to={`/gestion/comunicados/${c.id}`} className="font-medium hover:text-viper hover:underline break-words">{c.titulo}</Link>
                  <p className="text-sm text-texto-suave mt-0.5">Publicado · {haceCuanto(c.fechaPublicacion)}</p>
                </div>
                <span className="shrink-0"><EstadoBadge tipo="alcanceComunicado" estado={c.alcance} /></span>
              </li>
            ))}
          </ul>
          {d.total > d.comunicados.length && <p className="text-sm text-texto-suave">{d.total} comunicados publicados en total</p>}
        </>
      ))}
    </BloqueOperativo>
  )
}