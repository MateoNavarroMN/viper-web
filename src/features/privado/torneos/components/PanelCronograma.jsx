import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { get } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import Badge from '../../../../shared/components/Badge'
import Checkbox from '../../../../shared/components/Checkbox'
import EmptyState from '../../../../shared/components/EmptyState'
import EstadoBadge from '../../../../shared/components/EstadoBadge'
import Spinner from '../../../../shared/components/Spinner'
import { agruparPorDia, esDelJugador, hoy } from '../cronograma'
import { partidosDelCuadro } from '../programacion'
import { ACCIONES_PARTIDO, ETIQUETA_INSTANCIA, fechaLarga, nombreCorto } from '../torneos'
import DetallePartido from './DetallePartido'

const cantidad = (n, singular, plural) => `${n} ${n === 1 ? singular : plural}`

// Un partido del cronograma: la hora a la izquierda (o «Sin franja»), los rivales, dónde se juega y el estado.
// Los partidos del jugador se resaltan con el borde verde y «Tu partido».
function FilaPartido({ partido, esMio, onAbrir }) {
  const { local, visitante, programacion, lugar } = partido
  return (
    <li>
      <button
        type="button"
        onClick={() => onAbrir(partido)}
        className={`w-full text-left flex flex-wrap sm:flex-nowrap items-start gap-x-4 gap-y-3 rounded-xl border p-4 cursor-pointer transition-colors hover:border-viper focus-visible:outline-2 focus-visible:outline-viper ${esMio ? 'border-viper/50 bg-viper/10' : 'border-gray-800 bg-fondo'}`}
      >
        <span className="w-14 shrink-0 tabular-nums">
          {programacion ? (
            <>
              <span className="block font-outfit text-lg font-bold">{programacion.horaInicio}</span>
              <span className="block text-xs text-texto-suave">a {programacion.horaFin}</span>
            </>
          ) : (
            <span className="block text-sm text-texto-suave">—</span>
          )}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block break-words">{local ? nombreCorto(local) : 'Por definir'}</span>
          <span className="block break-words text-texto-suave">vs {visitante ? nombreCorto(visitante) : 'Por definir'}</span>
          <span className="block text-sm text-texto-suave mt-2">{programacion ? `${lugar} · ${programacion.cancha.nombre}` : lugar}</span>
        </span>
        <span className="flex gap-2 max-sm:w-full max-sm:flex-wrap sm:flex-col sm:items-end sm:shrink-0">
          <EstadoBadge tipo="partido" estado={partido.estado} />
          {esMio && <Badge variante="violeta">Tu partido</Badge>}
        </span>
      </button>
    </li>
  )
}

function Grupo({ titulo, extra, partidos, jugadorId, onAbrir }) {
  return (
    <section aria-label={titulo} className="bg-panel border border-gray-800 rounded-2xl p-5 md:p-6">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-4">
        <h3 className="font-outfit text-lg font-bold">{titulo}</h3>
        {extra}
        <p className="text-sm text-texto-suave">{cantidad(partidos.length, 'partido', 'partidos')}</p>
      </div>
      <ul className="flex flex-col gap-3">
        {partidos.map((p) => <FilaPartido key={p.id} partido={p} esMio={esDelJugador(p, jugadorId)} onAbrir={onAbrir} />)}
      </ul>
    </section>
  )
}

// Pestaña «Cronograma» del torneo (CU 3.4 · paso 7): todos los partidos agrupados por día, con hora, cancha, rivales y estado,
// y los que todavía no tienen franja en un grupo aparte. Sale de GET /torneos/:id/cuadro (no hay un endpoint propio).
//   jugadorId:      `usuario.jugador_id` del jugador que mira; resalta sus partidos y ofrece «Solo mis partidos». null para el personal.
//   puedeGestionar: Organizador o Administrador; desde el detalle del partido pueden programarlo o reprogramarlo (CU 3.5).
export default function PanelCronograma({ torneo, jugadorId = null, puedeGestionar = false }) {
  const navigate = useNavigate()
  const generado = ['EN_CURSO', 'FINALIZADO', 'ARCHIVADO'].includes(torneo.estado)
  const [reintento, setReintento] = useState(0)
  const [soloMios, setSoloMios] = useState(false)
  const [abierto, setAbierto] = useState(null) // partido abierto en el detalle
  const [resultado, setResultado] = useState(null) // { clave, cuadro, error }
  const clave = `${torneo.id}|${torneo.estado}|${reintento}`
  const actual = resultado?.clave === clave ? resultado : null

  useEffect(() => {
    if (!generado) return undefined
    let vigente = true
    get(`/torneos/${torneo.id}/cuadro`)
      .then((cuadro) => vigente && setResultado({ clave, cuadro }))
      .catch((e) => vigente && setResultado({ clave, error: e.mensaje }))
    return () => {
      vigente = false
    }
  }, [generado, torneo.id, clave])

  if (torneo.estado === 'CANCELADO') return <Alert variante="info">El torneo se canceló antes de generar el cuadro: no hay cronograma.</Alert>
  if (!generado) return <EmptyState titulo="Todavía no hay cronograma" descripcion="El cronograma se arma cuando se genera el cuadro y se programan los partidos." />
  if (!actual) return <div className="py-16 flex justify-center"><Spinner texto="Cargando cronograma" /></div>
  if (actual.error) {
    return (
      <Alert variante="error" titulo="No pudimos cargar el cronograma">
        {actual.error}{' '}
        <button type="button" onClick={() => setReintento((n) => n + 1)} className="underline font-semibold cursor-pointer">Reintentar</button>
      </Alert>
    )
  }

  const todos = partidosDelCuadro(actual.cuadro, ETIQUETA_INSTANCIA).filter((p) => !p.esBye)
  const mios = todos.filter((p) => esDelJugador(p, jugadorId))
  const mostrados = soloMios ? mios : todos
  const { dias, sinProgramar } = agruparPorDia(mostrados)
  const programados = todos.length - todos.filter((p) => !p.programacion).length
  const hoyFecha = hoy()

  const programar = (partido) => navigate(`/gestion/torneos/${torneo.id}/partidos/${partido.id}/programar`)
  const acciones = puedeGestionar ? ACCIONES_PARTIDO.map((a) => (a.clave === 'REPROGRAMAR' ? { ...a, onClick: programar } : a)) : []
  // El detalle muestra «Zona A · Fecha 1» con `zonaNombre`; en la eliminatoria sale de `instancia`
  const detalle = abierto ? { ...abierto, zonaNombre: abierto.instancia ? undefined : abierto.lugar } : null

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-texto-suave">
          {cantidad(programados, 'partido programado', 'partidos programados')}
          {todos.length > programados && ` · ${todos.length - programados} sin programar`}
        </p>
        {jugadorId && (
          <label className={`flex items-center gap-3 w-fit ${mios.length === 0 ? 'opacity-60' : ''}`}>
            <Checkbox checked={soloMios} disabled={mios.length === 0} onChange={(e) => setSoloMios(e.target.checked)} />
            <span>Solo mis partidos ({mios.length})</span>
          </label>
        )}
      </div>

      {todos.length === 0 && <EmptyState titulo="Todavía no hay partidos" descripcion="Los partidos aparecen acá cuando se genera el cuadro." />}
      {todos.length > 0 && mostrados.length === 0 && <EmptyState titulo="No tenés partidos en este torneo" descripcion="Cuando juegues uno, lo vas a ver acá." />}

      {dias.map(({ fecha, partidos }) => (
        <Grupo
          key={fecha}
          titulo={fechaLarga(fecha)}
          extra={fecha === hoyFecha ? <Badge variante="info">Hoy</Badge> : null}
          partidos={partidos}
          jugadorId={jugadorId}
          onAbrir={setAbierto}
        />
      ))}
      {sinProgramar.length > 0 && (
        <Grupo titulo="Sin programar" extra={<Badge variante="advertencia">Sin franja</Badge>} partidos={sinProgramar} jugadorId={jugadorId} onAbrir={setAbierto} />
      )}

      <DetallePartido partido={detalle} acciones={acciones} onCerrar={() => setAbierto(null)} />
    </div>
  )
}