import { Link } from 'react-router-dom'
import Badge from '../../../../shared/components/Badge'
import { DISCIPLINAS, rutaRanking } from '../../ranking/ranking'
import { TEXTO_DISCIPLINA, escribirPuntos } from '../portal'
import { usePortal } from '../usePortal'
import BloquePortal from './BloquePortal'

// Una disciplina: sus puntos, su puesto y su categoría técnica. Quien todavía no tiene puntos ve su categoría inicial con 0.
function TarjetaDisciplina({ fila }) {
  const disciplina = DISCIPLINAS.find((d) => d.api === fila.disciplina)
  return (
    <div className="bg-fondo border border-gray-800 rounded-xl p-4 flex flex-col gap-3">
      <p className="text-xs font-bold uppercase tracking-wide text-texto-suave">{TEXTO_DISCIPLINA[fila.disciplina]}</p>
      {fila.participa ? (
        <>
          <div className="flex items-end justify-between gap-3">
            <p className="font-outfit text-3xl font-bold tabular-nums">{escribirPuntos(fila.puntos)}</p>
            <p className="text-sm font-semibold text-viper">Puesto {fila.posicion}</p>
          </div>
          <p className="text-xs text-texto-suave -mt-2">puntos</p>
          {fila.sinPuntos && <p className="text-xs text-texto-suave">Todavía no registrás puntos en {TEXTO_DISCIPLINA[fila.disciplina]}.</p>}
          <div><Badge variante="info">{fila.categoria}</Badge></div>
        </>
      ) : (
        <p className="text-sm text-texto-suave">Todavía no participás en esta disciplina.</p>
      )}
      <Link to={rutaRanking(disciplina)} className="text-sm font-semibold text-viper hover:underline w-fit">
        Ver ranking
      </Link>
    </div>
  )
}

// Bloque «Mi ranking»: una tarjeta por disciplina (Tenis y Pádel).
export default function MiRanking() {
  const portal = usePortal('/portal/ranking')
  return (
    <BloquePortal titulo="Mi ranking" estado={portal}>
      {portal.datos && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {portal.datos.ranking.map((fila) => (
            <TarjetaDisciplina key={fila.disciplina} fila={fila} />
          ))}
        </div>
      )}
    </BloquePortal>
  )
}