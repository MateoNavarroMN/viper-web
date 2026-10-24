import Badge from '../../../../shared/components/Badge'
import Button from '../../../../shared/components/Button'
import EstadoBadge from '../../../../shared/components/EstadoBadge'
import Modal from '../../../../shared/components/Modal'
import { ETIQUETA_INSTANCIA, fechaPartido, nombrePareja } from '../torneos'

// Un participante del partido con su marcador. `ganador` lo resalta; `hueco` es el texto cuando todavía no hay nadie.
function Participante({ participante, hueco, ganador, juegos }) {
  return (
    <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${ganador ? 'border-viper/50 bg-viper/10' : 'border-gray-800 bg-fondo'}`}>
      <div className="flex-1 min-w-0">
        {participante ? (
          <>
            <p className="font-semibold break-words">{nombrePareja(participante)}</p>
            <div className="flex flex-wrap gap-2 mt-1">
              {participante.cabezaDeSerie && <Badge variante="violeta">Cabeza de serie</Badge>}
              {ganador && <Badge variante="exito">Ganador</Badge>}
            </div>
          </>
        ) : (
          <p className="text-texto-suave">{hueco}</p>
        )}
      </div>
      {juegos.length > 0 && (
        <p className="flex gap-2 font-outfit text-lg font-bold tabular-nums">
          {juegos.map((j, i) => <span key={i} className="w-4 text-center">{j}</span>)}
        </p>
      )}
    </div>
  )
}

// Detalle de un partido del cuadro (se abre al tocarlo). `acciones` son las que puede hacer quien gestiona el torneo:
// [{ clave, texto, variante, disponible(partido), onClick(partido) }]. Una acción sin `onClick` se muestra deshabilitada.
export default function DetallePartido({ partido, acciones = [], onCerrar }) {
  if (!partido) return null
  const { local, visitante, programacion, esBye } = partido
  const hueco = esBye ? 'BYE' : 'Por definir'
  const juegos = (lado) => partido.sets?.map((s) => s[lado]) ?? []
  const gana = (p) => Boolean(p) && !esBye && partido.ganadorInscripcionId === p.inscripcionId
  const disponibles = acciones.filter((a) => a.disponible(partido))
  // En el cuadro, «Cuartos de final · Partido 2»; en una zona, «Zona A · Fecha 1»
  const titulo = partido.instancia ? `${ETIQUETA_INSTANCIA[partido.instancia]} · Partido ${partido.posicion}` : `${partido.zonaNombre ?? 'Zona'} · Fecha ${partido.ronda}`
  const sinHacer = disponibles.some((a) => !a.onClick)

  return (
    <Modal abierto titulo={titulo} onCerrar={onCerrar} posicion="abajo-movil">
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {esBye ? <Badge variante="neutro">BYE</Badge> : <EstadoBadge tipo="partido" estado={partido.estado} />}
      </div>

      <div className="flex flex-col gap-2">
        <Participante participante={local} hueco={hueco} ganador={gana(local)} juegos={juegos('local')} />
        <Participante participante={visitante} hueco={hueco} ganador={gana(visitante)} juegos={juegos('visitante')} />
      </div>

      {esBye ? (
        <p className="text-sm text-texto-suave mt-5">Sin rival: avanza a la ronda siguiente sin jugar.</p>
      ) : (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 mt-5">
          <div>
            <dt className="text-[13px] text-texto-suave">Fecha y hora</dt>
            <dd className="mt-1">{programacion ? `${fechaPartido(programacion.fecha, programacion.horaInicio)} a ${programacion.horaFin}` : 'Sin programar'}</dd>
          </div>
          <div>
            <dt className="text-[13px] text-texto-suave">Cancha</dt>
            <dd className="mt-1">{programacion ? programacion.cancha.nombre : '—'}</dd>
          </div>
        </dl>
      )}

      {disponibles.length > 0 && (
        <div className="mt-6 pt-5 border-t border-gray-800">
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
            {disponibles.map((a) => (
              <Button key={a.clave} variante={a.variante} className="w-full sm:w-auto" disabled={!a.onClick} onClick={() => a.onClick(partido)}>
                {a.texto}
              </Button>
            ))}
          </div>
          {sinHacer && <p className="text-sm text-texto-suave mt-3">Estas acciones se habilitan con las próximas tareas del plan.</p>}
        </div>
      )}
    </Modal>
  )
}