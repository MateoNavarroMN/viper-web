import { fechaPartido, nombreCorto } from '../torneos'

function Estrella() {
  return (
    <svg className="shrink-0 text-violeta" width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-label="Cabeza de serie" role="img">
      <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" />
    </svg>
  )
}

// Texto de la programación que va debajo del partido: «Jue 12/11 · 10:00 · Tenis 1», «Sin programar» o nada.
// Devuelve { texto, sinProgramar }.
const programacionDe = (partido) => {
  if (partido.esBye) return null
  if (partido.programacion) {
    const { fecha, horaInicio, cancha } = partido.programacion
    return { texto: `${fechaPartido(fecha, horaInicio)} · ${cancha.nombre}`, sinProgramar: false }
  }
  if (partido.local && partido.visitante && partido.estado === 'PENDIENTE') return { texto: 'Sin programar', sinProgramar: true }
  return null
}

// Una de las dos filas del partido: el participante (o «BYE» / «Por definir»), su estrella y, a la derecha, el marcador
// o «W.O.» / «Baja».
function Fila({ partido, lado, alto }) {
  const participante = partido[lado]
  const esWO = partido.estado === 'WO'
  const definido = Boolean(participante) && !partido.esBye && Boolean(partido.ganadorInscripcionId)
  const gano = definido && partido.ganadorInscripcionId === participante.inscripcionId
  const perdio = definido && !gano
  // Las filas sin participante son el hueco de un bye o un rival que todavía no se definió
  const hueco = partido.esBye ? 'BYE' : 'Por definir'

  let derecha = null
  if (esWO && participante && partido.ganadorInscripcionId) {
    derecha = gano
      ? <span className="text-advertencia font-semibold">W.O.</span>
      : <span className="text-error">Baja</span>
  } else if (esWO && participante && partido.wo?.ausente === 'AMBOS') {
    derecha = <span className="text-error">Baja</span>
  } else if (partido.sets?.length > 0 && participante) {
    const otroLado = lado === 'local' ? 'visitante' : 'local'
    derecha = (
      <span className="flex gap-1.5 tabular-nums">
        {partido.sets.map((s, i) => (
          <span key={i} className={`w-3 text-center ${s[lado] > s[otroLado] ? 'font-bold text-texto' : 'text-texto-suave'}`}>{s[lado]}</span>
        ))}
      </span>
    )
  }

  return (
    <span className={`flex items-center gap-2 px-3 ${alto} ${gano ? 'bg-viper/10' : ''}`}>
      {participante ? (
        <>
          {participante.cabezaDeSerie && <Estrella />}
          <span className={`flex-1 min-w-0 truncate ${gano ? 'font-semibold text-texto' : perdio ? 'text-texto-suave' : ''}`} title={nombreCorto(participante)}>
            {nombreCorto(participante)}
          </span>
        </>
      ) : (
        <span className={`flex-1 ${partido.esBye ? 'text-texto-suave font-semibold tracking-wide' : 'text-texto-suave'}`}>{hueco}</span>
      )}
      {derecha}
    </span>
  )
}

// Un partido del cuadro (200 px en la grilla de escritorio, a todo el ancho en el celular). Se toca para ver el detalle.
//   `flotante`: la programación se dibuja debajo sin sumar alto, así los conectores salen del centro del partido.
export default function PartidoCard({ partido, flotante = false, onSeleccionar }) {
  const programacion = programacionDe(partido)
  const alto = flotante ? 'h-[26px]' : 'h-11'
  const rivales = [partido.local, partido.visitante].map((p) => (p ? nombreCorto(p) : partido.esBye ? 'BYE' : 'por definir')).join(' contra ')

  return (
    <div className={flotante ? 'relative' : ''}>
      <button
        type="button"
        onClick={() => onSeleccionar(partido)}
        aria-label={`Partido: ${rivales}. Ver detalle`}
        className={`w-full block text-left bg-panel border rounded-lg overflow-hidden cursor-pointer transition-colors hover:border-viper focus-visible:outline-2 focus-visible:outline-viper ${partido.estado === 'WO' ? 'border-advertencia/60' : 'border-gray-800'} ${flotante ? 'text-[13px]' : 'text-sm'}`}
      >
        <Fila partido={partido} lado="local" alto={alto} />
        <span className="block border-t border-gray-800" />
        <Fila partido={partido} lado="visitante" alto={alto} />
      </button>
      {programacion && (
        <p className={`text-xs truncate ${flotante ? 'absolute left-0 top-full mt-1 w-full' : 'mt-1.5 px-1'} ${programacion.sinProgramar ? 'text-advertencia' : 'text-texto-suave'}`}>
          {programacion.texto}
        </p>
      )}
    </div>
  )
}