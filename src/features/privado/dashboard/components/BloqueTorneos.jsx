import { Link } from 'react-router-dom'
import EstadoBadge from '../../../../shared/components/EstadoBadge'
import { useConsulta } from '../useConsulta'
import { COLOR_ESTADO_TORNEO } from '../dashboard'
import BloqueOperativo, { AvisoDeBloque, Barra } from './BloqueOperativo'

const VISIBLES = 5

// Torneos vigentes (en curso y planificados) con su cupo ocupado y las inscripciones con el pago pendiente.
export default function BloqueTorneos() {
  const consulta = useConsulta('/dashboard/torneos')
  return (
    <BloqueOperativo titulo="Torneos" ruta="/gestion/torneos" consulta={consulta}>
      {(d) => (d.sinTorneos ? (
        // 7a
        <AvisoDeBloque>No hay torneos en curso ni planificados. Creá uno desde Torneos y Ligas.</AvisoDeBloque>
      ) : (
        <>
          <ul className="flex flex-col gap-5">
            {d.torneos.slice(0, VISIBLES).map((t) => (
              <li key={t.id}>
                <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                  <Link to={`/gestion/torneos/${t.id}`} className="font-medium hover:text-viper hover:underline min-w-0 break-words">{t.nombre}</Link>
                  <span className="shrink-0"><EstadoBadge tipo="torneo" estado={t.estado} /></span>
                </div>
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm mt-1">
                  <span className="text-texto-suave tabular-nums">Cupo {t.inscriptos} de {t.cupoMaximo}</span>
                  <span className={t.pendientesDePago > 0 ? 'text-advertencia' : 'text-texto-suave'}>
                    {t.pendientesDePago > 0
                      ? `${t.pendientesDePago} ${t.pendientesDePago === 1 ? 'inscripción pendiente' : 'inscripciones pendientes'} de pago`
                      : 'Sin inscripciones pendientes'}
                  </span>
                </div>
                <div className="mt-2"><Barra porcentaje={t.cupoMaximo ? (t.inscriptos / t.cupoMaximo) * 100 : 0} color={COLOR_ESTADO_TORNEO[t.estado]} /></div>
              </li>
            ))}
          </ul>
          {d.torneos.length > VISIBLES && (
            <p className="text-sm text-texto-suave">y {d.torneos.length - VISIBLES} más en Torneos y Ligas</p>
          )}
        </>
      ))}
    </BloqueOperativo>
  )
}