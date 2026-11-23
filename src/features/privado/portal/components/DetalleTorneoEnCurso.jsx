import Badge from '../../../../shared/components/Badge'
import { Tabla } from '../../torneos/components/ZonaCard'
import { fechaPartido, nombrePareja } from '../../torneos/torneos'
import { ETAPA_DEL_TORNEO, TEXTO_DISCIPLINA, etapaDelPartido } from '../portal'

// Qué le pasó (o le va a pasar) al jugador en uno de sus partidos: marcador visto desde su lado, W.O. o cuándo y dónde se juega.
function estadoDelPartido(partido, mi) {
  const lado = partido.local?.inscripcionId === mi ? 'local' : 'visitante'
  const otro = lado === 'local' ? 'visitante' : 'local'
  const gano = partido.ganadorInscripcionId === mi

  if (partido.estado === 'WO') return { texto: gano ? 'Ganaste por W.O.' : 'Perdiste por W.O.', insignia: gano ? 'exito' : 'error' }
  if (partido.estado === 'FINALIZADO') {
    const marcador = partido.sets.map((s) => `${s[lado]}-${s[otro]}`).join('  ')
    return { texto: marcador, insignia: gano ? 'exito' : 'error', etiqueta: gano ? 'Ganaste' : 'Perdiste' }
  }
  if (partido.programacion) {
    const { fecha, horaInicio, cancha } = partido.programacion
    return { texto: `${fechaPartido(fecha, horaInicio)} · ${cancha.nombre}` }
  }
  return { texto: partido[otro] ? 'Sin programar' : 'Esperando al rival', apagado: true }
}

function FilaPartido({ partido, mi }) {
  const rival = partido.local?.inscripcionId === mi ? partido.visitante : partido.local
  const estado = estadoDelPartido(partido, mi)
  return (
    <li className="py-3 flex flex-col gap-1">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm break-words min-w-0">
          <span className="text-texto-suave">vs. </span>
          {rival ? nombrePareja(rival) : <span className="text-texto-suave">Por definir</span>}
        </p>
        {estado.etiqueta && <Badge variante={estado.insignia}>{estado.etiqueta}</Badge>}
        {!estado.etiqueta && estado.insignia && <Badge variante={estado.insignia}>{estado.texto}</Badge>}
      </div>
      <p className="text-xs text-texto-suave break-words">
        {etapaDelPartido(partido)}
        {!(estado.insignia && !estado.etiqueta) && <> · <span className={estado.apagado ? '' : 'text-texto'}>{estado.texto}</span></>}
      </p>
    </li>
  )
}

// Un torneo en curso: el cronograma de los partidos del jugador y la tabla de posiciones de su zona. Va directo en el bloque
// «Torneos en curso», sin abrir otra ventana.
export default function DetalleTorneoEnCurso({ torneo }) {
  const { miInscripcionId: mi, miZona, misPartidos } = torneo
  return (
    <article aria-label={torneo.nombre} className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Badge variante="info">{ETAPA_DEL_TORNEO[torneo.faseActual] ?? 'En curso'}</Badge>
        <h3 className="font-outfit text-base font-bold break-words">{torneo.nombre} · {TEXTO_DISCIPLINA[torneo.disciplina]}</h3>
      </div>

      <section aria-label="Cronograma">
        <h4 className="text-xs font-bold uppercase tracking-wide text-texto-suave mb-1">Cronograma</h4>
        {misPartidos.length === 0 ? (
          <p className="text-sm text-texto-suave py-3">Todavía no tenés partidos en este torneo.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-gray-800">
            {misPartidos.map((p) => <FilaPartido key={p.id} partido={p} mi={mi} />)}
          </ul>
        )}
      </section>

      {miZona && (
        <section aria-label={`Posiciones de ${miZona.nombre}`}>
          <h4 className="text-xs font-bold uppercase tracking-wide text-texto-suave mb-2">Tabla de posiciones · {miZona.nombre}</h4>
          <Tabla zona={miZona} unidad={torneo.disciplina === 'PADEL' ? 'parejas' : 'jugadores'} />
          {miZona.cerrada && <p className="text-xs text-texto-suave mt-2">La zona ya terminó.</p>}
        </section>
      )}
    </article>
  )
}