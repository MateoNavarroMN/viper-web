import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { get } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import EmptyState from '../../../../shared/components/EmptyState'
import EstadoBadge from '../../../../shared/components/EstadoBadge'
import Spinner from '../../../../shared/components/Spinner'
import { ETIQUETA_DISCIPLINA, rangoFechas } from '../torneos'

const RUTA = '/gestion/inscripciones'

// Primero los que están recibiendo inscripciones, después los demás; dentro de cada grupo, el que arranca antes
const abiertosPrimero = (a, b) =>
  (b.estado === 'INSCRIPCIONES_ABIERTAS') - (a.estado === 'INSCRIPCIONES_ABIERTAS') || a.fechaInicio.localeCompare(b.fechaInicio)

function Tarjeta({ torneo }) {
  const porcentaje = torneo.cupoMaximo > 0 ? Math.min(100, (torneo.inscriptos / torneo.cupoMaximo) * 100) : 0
  return (
    <li>
      <Link
        to={`${RUTA}/${torneo.id}`}
        className="block h-full bg-panel border border-gray-800 hover:border-viper rounded-2xl p-5 transition-colors focus-visible:outline-2 focus-visible:outline-viper"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-outfit text-lg font-bold break-words">{torneo.nombre}</h2>
            <p className="text-sm text-texto-suave truncate">{torneo.categoria} · {ETIQUETA_DISCIPLINA[torneo.disciplina]}</p>
          </div>
          <span className="shrink-0"><EstadoBadge tipo="torneo" estado={torneo.estado} /></span>
        </div>
        <div className="flex items-end justify-between gap-4 mt-4">
          <p className="text-xs text-texto-suave tabular-nums">{rangoFechas(torneo.fechaInicio, torneo.fechaFin)}</p>
          <div className="w-24">
            <p className="text-sm tabular-nums">{torneo.inscriptos} / {torneo.cupoMaximo}<span className="sr-only"> inscriptos</span></p>
            <div className="h-1 mt-1.5 rounded-full bg-gray-800 overflow-hidden" aria-hidden="true">
              <div className="h-full rounded-full bg-viper" style={{ width: `${porcentaje}%` }} />
            </div>
          </div>
        </div>
      </Link>
    </li>
  )
}

// Inscripciones (Recepcionista, Organizador y Administrador): los torneos que ya tienen inscripciones, para entrar a
// ver los inscriptos y registrar pagos en efectivo. Un torneo PLANIFICADO todavía no tiene y no aparece.
export default function Inscripciones() {
  const [reintento, setReintento] = useState(0)
  const [resultado, setResultado] = useState(null) // { clave, torneos, error }
  const clave = String(reintento)
  const error = resultado?.clave === clave ? resultado.error : null
  const torneos = resultado?.torneos ?? null

  useEffect(() => {
    let vigente = true
    get('/torneos?vista=activos')
      .then((r) => vigente && setResultado({ clave, torneos: r.torneos.filter((t) => t.accionesPermitidas.includes('VER_INSCRIPTOS')).sort(abiertosPrimero) }))
      .catch((e) => vigente && setResultado((anterior) => ({ clave, torneos: anterior?.torneos, error: e.mensaje })))
    return () => {
      vigente = false
    }
  }, [clave])

  const recargar = useCallback(() => setReintento((n) => n + 1), [])

  return (
    <div className="max-w-7xl mx-auto w-full flex flex-col gap-6">
      <div>
        <h1 className="font-outfit text-[28px] font-bold">Inscripciones</h1>
        <p className="text-texto-suave text-sm mt-1">Elegí un torneo para ver sus inscriptos y registrar pagos en efectivo</p>
      </div>

      {error ? (
        <Alert variante="error" titulo="No pudimos cargar los torneos">
          {error}{' '}
          <button type="button" onClick={recargar} className="underline font-semibold cursor-pointer">Reintentar</button>
        </Alert>
      ) : !torneos ? (
        <div className="py-16 flex justify-center">
          <Spinner texto="Cargando torneos" />
        </div>
      ) : torneos.length === 0 ? (
        <EmptyState titulo="No hay torneos con inscripciones" descripcion="Cuando el Organizador abra las inscripciones de un torneo, lo vas a ver acá." />
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {torneos.map((t) => <Tarjeta key={t.id} torneo={t} />)}
        </ul>
      )}
    </div>
  )
}