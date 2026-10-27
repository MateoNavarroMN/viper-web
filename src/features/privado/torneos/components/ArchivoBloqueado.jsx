import { Link } from 'react-router-dom'
import Alert from '../../../../shared/components/Alert'
import Badge from '../../../../shared/components/Badge'
import EstadoBadge from '../../../../shared/components/EstadoBadge'
import { estadosParaArchivar, textoEstadoActual } from '../archivo'
import { ETIQUETA_DISCIPLINA } from '../torneos'

const RUTA = '/gestion/torneos'
const TARJETA = 'bg-panel border border-gray-800 rounded-2xl p-5 md:p-6'
const TITULO_SECCION = 'text-xs font-bold uppercase tracking-wide text-texto-suave'

// Pantallas de los flujos 5a y 5b del CU 3.8, cuando el torneo no se puede archivar:
//   5a · el torneo no está finalizado (`estado` es el actual): «No se puede archivar este torneo» y qué estados lo permiten.
//   5b · el torneo ya está archivado (`torneo` llega con su resumen): no hay nada que hacer, solo se consulta desde Históricos.
export default function ArchivoBloqueado({ estado, torneo = null }) {
  if (estado === 'ARCHIVADO') {
    return (
      <div className="flex flex-col gap-6">
        <Alert variante="info" titulo="Este torneo ya está archivado">
          No hay ninguna acción pendiente: el sistema no realiza cambios.
        </Alert>
        {torneo && (
          <section className={TARJETA} aria-label="Torneo archivado">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="font-outfit text-xl font-bold break-words">{torneo.nombre}</h2>
                  <EstadoBadge tipo="torneo" estado="ARCHIVADO" />
                </div>
                <p className="text-sm text-texto-suave mt-1">
                  {torneo.categoria} · {ETIQUETA_DISCIPLINA[torneo.disciplina]}
                </p>
              </div>
              <Link
                to={`${RUTA}/${torneo.id}`}
                className="font-outfit font-semibold text-center px-6 py-2 rounded-lg bg-panel border border-gray-800 hover:border-viper transition-colors"
              >
                Ver detalle
              </Link>
            </div>
            <p className="text-sm text-texto-suave mt-4">Únicamente se puede consultar desde la sección Históricos.</p>
          </section>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Alert variante="error" titulo="No se puede archivar este torneo">
        Solo pueden archivarse torneos ya finalizados. {textoEstadoActual(estado)}
      </Alert>
      <section className={TARJETA} aria-label="Según el estado del torneo">
        <h2 className={`${TITULO_SECCION} mb-4`}>Según el estado del torneo</h2>
        <ul className="divide-y divide-gray-800">
          {estadosParaArchivar().map((e) => (
            <li key={e.estado} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
              <span className={e.estado === estado ? 'font-semibold' : ''}>{e.texto}</span>
              <Badge variante={e.permitido ? 'exito' : 'neutro'}>{e.permitido ? 'Se puede archivar' : 'Bloqueado'}</Badge>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}