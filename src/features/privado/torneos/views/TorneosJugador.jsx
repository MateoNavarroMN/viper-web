import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { get } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import EmptyState from '../../../../shared/components/EmptyState'
import EstadoBadge from '../../../../shared/components/EstadoBadge'
import Spinner from '../../../../shared/components/Spinner'
import Tabs from '../../../../shared/components/Tabs'
import MisInscripciones from '../components/MisInscripciones'
import { ETIQUETA_DISCIPLINA, ETIQUETA_FORMATO, precio, rangoFechas } from '../torneos'

const RUTA = '/portal/torneos'

const PESTANAS = [
  { clave: 'disponibles', titulo: 'Disponibles' },
  { clave: 'mias', titulo: 'Mis inscripciones' },
]

// Lo que el jugador puede ver: abiertos a inscripción primero (más próximos antes) y después los que se están jugando
const ORDEN = ['INSCRIPCIONES_ABIERTAS', 'EN_CURSO']
const porEstadoYFecha = (a, b) => ORDEN.indexOf(a.estado) - ORDEN.indexOf(b.estado) || a.fechaInicio.localeCompare(b.fechaInicio)

function TarjetaTorneo({ torneo }) {
  const completo = torneo.estado === 'INSCRIPCIONES_ABIERTAS' && torneo.cupoDisponible === 0
  return (
    <li>
      <Link
        to={`${RUTA}/${torneo.id}`}
        className="block h-full bg-panel border border-gray-800 hover:border-viper rounded-2xl p-5 transition-colors focus-visible:outline-2 focus-visible:outline-viper"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-outfit text-lg font-bold truncate">{torneo.nombre}</h2>
            <p className="text-sm text-texto-suave truncate">
              {ETIQUETA_DISCIPLINA[torneo.disciplina]} · {torneo.categoria} · {ETIQUETA_FORMATO[torneo.formato]}
            </p>
          </div>
        </div>
        <div className="mt-3">
          <EstadoBadge tipo="torneo" estado={torneo.estado} />
        </div>
        <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
          <div>
            <dt className="text-xs text-texto-suave">Fechas</dt>
            <dd className="tabular-nums">{rangoFechas(torneo.fechaInicio, torneo.fechaFin)}</dd>
          </div>
          <div>
            <dt className="text-xs text-texto-suave">Cupo</dt>
            <dd className={`tabular-nums ${completo ? 'text-error' : ''}`}>
              {torneo.estado === 'INSCRIPCIONES_ABIERTAS' ? (completo ? 'Completo' : `${torneo.cupoDisponible} libres`) : `${torneo.inscriptos} inscriptos`}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-texto-suave">Precio</dt>
            <dd className="tabular-nums">{precio(torneo.precioInscripcion)}</dd>
          </div>
        </dl>
      </Link>
    </li>
  )
}

// Pestaña «Disponibles»: los torneos con inscripciones abiertas y los que están en curso.
function Disponibles() {
  const [reintento, setReintento] = useState(0)
  const [resultado, setResultado] = useState(null) // { clave, torneos, error }
  const clave = String(reintento)
  const cargando = resultado?.clave !== clave
  const error = resultado?.clave === clave ? resultado.error : null
  const torneos = resultado?.torneos ?? null

  useEffect(() => {
    let vigente = true
    // La API filtra por un estado a la vez: se piden los dos y se juntan
    Promise.all([get('/torneos?estado=INSCRIPCIONES_ABIERTAS'), get('/torneos?estado=EN_CURSO')])
      .then(([abiertos, enCurso]) => vigente && setResultado({ clave, torneos: [...abiertos.torneos, ...enCurso.torneos].sort(porEstadoYFecha) }))
      .catch((e) => vigente && setResultado((anterior) => ({ clave, torneos: anterior?.torneos, error: e.mensaje })))
    return () => {
      vigente = false
    }
  }, [clave])

  const recargar = useCallback(() => setReintento((n) => n + 1), [])

  if (error) {
    return (
      <Alert variante="error" titulo="No pudimos cargar los torneos">
        {error}{' '}
        <button type="button" onClick={recargar} className="underline font-semibold cursor-pointer">Reintentar</button>
      </Alert>
    )
  }
  if (!torneos || cargando) {
    return (
      <div className="py-16 flex justify-center">
        <Spinner texto="Cargando torneos" />
      </div>
    )
  }
  if (torneos.length === 0) {
    return <EmptyState titulo="No hay torneos disponibles" descripcion="Cuando el club abra inscripciones vas a verlas acá." />
  }
  return (
    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {torneos.map((t) => <TarjetaTorneo key={t.id} torneo={t} />)}
    </ul>
  )
}

// Torneos del portal del jugador (/portal/torneos). La pestaña vive en la URL (?vista=mias) para poder
// volver desde la ficha o el resultado de una inscripción.
export default function TorneosJugador() {
  const [parametros, setParametros] = useSearchParams()
  const vista = parametros.get('vista') === 'mias' ? 'mias' : 'disponibles'

  return (
    <div className="max-w-5xl mx-auto w-full flex flex-col gap-6">
      <div>
        <h1 className="font-outfit text-[28px] font-bold">Torneos</h1>
        <p className="text-texto-suave text-sm mt-1">Inscribite en los torneos del club y seguí los que se están jugando</p>
      </div>

      <Tabs pestanas={PESTANAS} activa={vista} onCambiar={(clave) => setParametros(clave === 'mias' ? { vista: clave } : {})} />

      {vista === 'mias' ? <MisInscripciones /> : <Disponibles />}
    </div>
  )
}