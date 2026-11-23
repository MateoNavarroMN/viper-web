import { useNavigate } from 'react-router-dom'
import Button from '../../../../shared/components/Button'
import { usePortal } from '../usePortal'
import Aviso from './Aviso'
import BloquePortal from './BloquePortal'
import DetalleTorneoEnCurso from './DetalleTorneoEnCurso'

// Bloque «Torneos en curso»: por cada torneo que juega el jugador, su cronograma de partidos y la tabla de posiciones de su zona.
// Sin torneos: un aviso y el acceso a los torneos con inscripción abierta.
export default function TorneosEnCurso() {
  const portal = usePortal('/portal/torneos')
  const navigate = useNavigate()
  const torneos = portal.datos?.torneos ?? []

  return (
    <BloquePortal titulo="Torneos en curso" enlace={torneos.length > 0 ? { texto: 'Ver torneos', to: '/portal/torneos' } : null} estado={portal}>
      {portal.datos && torneos.length === 0 ? (
        <Aviso titulo="No participás en ningún torneo en curso">
          <Button variante="neutro" onClick={() => navigate('/portal/torneos')}>Ver torneos con inscripción abierta</Button>
        </Aviso>
      ) : (
        <div className="flex flex-col gap-8">
          {torneos.map((t) => <DetalleTorneoEnCurso key={t.id} torneo={t} />)}
        </div>
      )}
    </BloquePortal>
  )
}