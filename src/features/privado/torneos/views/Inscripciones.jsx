import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { get } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import Button from '../../../../shared/components/Button'
import EmptyState from '../../../../shared/components/EmptyState'
import EstadoBadge from '../../../../shared/components/EstadoBadge'
import Select from '../../../../shared/components/Select'
import Spinner from '../../../../shared/components/Spinner'
import ToggleVista from '../../../../shared/components/ToggleVista'
import { useVistaGuardada } from '../../../../shared/hooks/useVistaGuardada'
import { ETIQUETA_DISCIPLINA, normalizar, rangoFechas } from '../torneos'

const RUTA = '/gestion/inscripciones'

const OPCIONES_DISCIPLINA = [
  { valor: '', texto: 'Disciplina: Todas' },
  ...Object.entries(ETIQUETA_DISCIPLINA).map(([valor, texto]) => ({ valor, texto })),
]

// Primero los que están recibiendo inscripciones, después los demás; dentro de cada grupo, el que arranca antes
const abiertosPrimero = (a, b) =>
  (b.estado === 'INSCRIPCIONES_ABIERTAS') - (a.estado === 'INSCRIPCIONES_ABIERTAS') || a.fechaInicio.localeCompare(b.fechaInicio)

// «12 / 32» con una barra de cuánto se llenó el cupo
function Cupo({ torneo }) {
  const porcentaje = torneo.cupoMaximo > 0 ? Math.min(100, (torneo.inscriptos / torneo.cupoMaximo) * 100) : 0
  return (
    <div className="w-24">
      <p className="text-sm tabular-nums">{torneo.inscriptos} / {torneo.cupoMaximo}<span className="sr-only"> inscriptos</span></p>
      <div className="h-1 mt-1.5 rounded-full bg-gray-800 overflow-hidden" aria-hidden="true">
        <div className="h-full rounded-full bg-viper" style={{ width: `${porcentaje}%` }} />
      </div>
    </div>
  )
}

// Una fila de la lista: nombre y categoría a la izquierda; en escritorio, fechas, cupo y estado en columnas
function Fila({ torneo }) {
  return (
    <li className="border-b border-gray-800 last:border-b-0">
      <Link
        to={`${RUTA}/${torneo.id}`}
        className="block px-4 sm:px-6 py-4 hover:bg-fondo/50 transition-colors focus-visible:outline-2 focus-visible:outline-viper focus-visible:-outline-offset-2"
      >
        <div className="grid items-center gap-x-4 gap-y-2 grid-cols-[1fr_auto] @3xl:grid-cols-[minmax(0,1fr)_10.5rem_7rem_12rem]">
          <div className="min-w-0">
            <p className="font-semibold truncate">{torneo.nombre}</p>
            <p className="text-sm text-texto-suave truncate">{torneo.categoria} · {ETIQUETA_DISCIPLINA[torneo.disciplina]}</p>
          </div>
          <span className="justify-self-end @3xl:order-last @3xl:justify-self-start"><EstadoBadge tipo="torneo" estado={torneo.estado} /></span>
          <p className="text-sm tabular-nums whitespace-nowrap text-texto-suave @3xl:text-texto">{rangoFechas(torneo.fechaInicio, torneo.fechaFin)}</p>
          <div className="justify-self-end @3xl:justify-self-start"><Cupo torneo={torneo} /></div>
        </div>
      </Link>
    </li>
  )
}

function Tarjeta({ torneo }) {
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
          <Cupo torneo={torneo} />
        </div>
      </Link>
    </li>
  )
}

// Inscripciones (Recepcionista, Organizador y Administrador): los torneos que ya tienen inscripciones, para entrar a
// ver los inscriptos y registrar pagos en efectivo. Un torneo PLANIFICADO todavía no tiene y no aparece.
export default function Inscripciones() {
  const [vista, setVista] = useVistaGuardada('viper_vista_inscripciones')
  const [q, setQ] = useState('')
  const [disciplina, setDisciplina] = useState('')
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

  const busqueda = normalizar(q)
  const visibles = (torneos ?? []).filter((t) => (!disciplina || t.disciplina === disciplina) && (!busqueda || normalizar(t.nombre).includes(busqueda)))
  const limpiarFiltros = () => {
    setQ('')
    setDisciplina('')
  }

  return (
    <div className="max-w-7xl mx-auto w-full flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-outfit text-[28px] font-bold">Inscripciones</h1>
          <p className="text-texto-suave text-sm mt-1">Elegí un torneo para ver sus inscriptos y registrar pagos en efectivo</p>
        </div>
        {torneos?.length > 0 && <ToggleVista valor={vista} onCambiar={setVista} />}
      </div>

      {torneos?.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="relative flex-1 sm:max-w-md">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-texto-suave pointer-events-none" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="search"
              aria-label="Buscar por nombre del torneo"
              placeholder="Buscar por nombre del torneo"
              maxLength={60}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full bg-fondo text-texto placeholder:text-texto-suave border border-gray-800 focus:border-viper rounded-lg pl-11 pr-4 py-3 text-sm focus:outline-none transition-colors"
            />
          </div>
          <Select aria-label="Filtrar por disciplina" opciones={OPCIONES_DISCIPLINA} value={disciplina} onChange={(e) => setDisciplina(e.target.value)} className="sm:w-56" />
        </div>
      )}

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
      ) : visibles.length === 0 ? (
        <EmptyState
          titulo="No encontramos torneos"
          descripcion="Probá con otro nombre o quitá el filtro."
          accion={<Button variante="secundario" onClick={limpiarFiltros}>Limpiar filtros</Button>}
        />
      ) : vista === 'filas' ? (
        <div className="@container">
        <ul className="bg-panel border border-gray-800 rounded-2xl overflow-hidden" aria-label="Torneos con inscripciones">
          <li aria-hidden="true" className="hidden @3xl:grid grid-cols-[minmax(0,1fr)_10.5rem_7rem_12rem] gap-x-4 px-6 py-3 border-b border-gray-800 text-xs font-semibold uppercase tracking-wide text-texto-suave">
            <span>Evento</span>
            <span>Fechas</span>
            <span>Inscriptos</span>
            <span>Estado</span>
          </li>
          {visibles.map((t) => <Fila key={t.id} torneo={t} />)}
        </ul>
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visibles.map((t) => <Tarjeta key={t.id} torneo={t} />)}
        </ul>
      )}
    </div>
  )
}