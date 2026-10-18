import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { get } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import BottomSheet from '../../../../shared/components/BottomSheet'
import Button from '../../../../shared/components/Button'
import EmptyState from '../../../../shared/components/EmptyState'
import EstadoBadge from '../../../../shared/components/EstadoBadge'
import Select from '../../../../shared/components/Select'
import Spinner from '../../../../shared/components/Spinner'
import Tabs from '../../../../shared/components/Tabs'
import { ESTADOS } from '../../../../shared/utils/estados'
import ConfirmarAccionTorneo from '../components/ConfirmarAccionTorneo'
import MenuAcciones from '../components/MenuAcciones'
import { ETIQUETA_DISCIPLINA, ETIQUETA_FORMATO, VISTAS, normalizar, precio, rangoFechas } from '../torneos'

const TAMANIO = 10
const RUTA = '/gestion/torneos'

const PESTANAS = [
  { clave: 'activos', titulo: 'Activos' },
  { clave: 'historicos', titulo: 'Históricos' },
]
const OPCIONES_DISCIPLINA = [
  { valor: '', texto: 'Disciplina: Todas' },
  ...Object.entries(ETIQUETA_DISCIPLINA).map(([valor, texto]) => ({ valor, texto })),
]
// El filtro de estado ofrece solo los estados de la pestaña elegida
const opcionesEstado = (vista) => [
  { valor: '', texto: 'Estado: Todos' },
  ...VISTAS[vista].map((valor) => ({ valor, texto: ESTADOS.torneo[valor].texto })),
]

// Opciones del menú ⋮ según `accionesPermitidas` del backend (Figma: «Acciones según el estado»)
const itemsDelMenu = (torneo, onAccion) => {
  const permitidas = torneo.accionesPermitidas
  const items = []
  if (permitidas.includes('EDITAR')) items.push({ texto: 'Editar', to: `${RUTA}/${torneo.id}/editar` })
  else items.push({ texto: 'Ver detalle', to: `${RUTA}/${torneo.id}` })
  if (permitidas.includes('ABRIR_INSCRIPCIONES')) items.push({ texto: 'Abrir inscripciones', onClick: () => onAccion('ABRIR_INSCRIPCIONES', torneo) })
  if (permitidas.includes('CERRAR_INSCRIPCIONES')) items.push({ texto: 'Cerrar inscripciones', onClick: () => onAccion('CERRAR_INSCRIPCIONES', torneo) })
  if (permitidas.includes('CANCELAR')) items.push({ texto: 'Cancelar torneo', onClick: () => onAccion('CANCELAR', torneo), peligro: true })
  return items
}

// Orden de la lista (como en Figma): primero por estado, en el orden en que avanza un torneo,
// y dentro de cada estado por fecha de inicio, el más próximo primero
const ORDEN_ESTADO = [...VISTAS.activos, ...VISTAS.historicos]
const porEstadoYFecha = (a, b) =>
  ORDEN_ESTADO.indexOf(a.estado) - ORDEN_ESTADO.indexOf(b.estado) || a.fechaInicio.localeCompare(b.fechaInicio)

// «12 / 32» con una barra de cuánto se llenó el cupo
function Cupo({ torneo }) {
  const porcentaje = torneo.cupoMaximo > 0 ? Math.min(100, (torneo.inscriptos / torneo.cupoMaximo) * 100) : 0
  return (
    <div className="w-24">
      <p className="text-sm tabular-nums">
        {torneo.inscriptos} / {torneo.cupoMaximo}
        <span className="sr-only"> inscriptos</span>
      </p>
      <div className="h-1 mt-1.5 rounded-full bg-gray-800 overflow-hidden" aria-hidden="true">
        <div className="h-full rounded-full bg-viper" style={{ width: `${porcentaje}%` }} />
      </div>
    </div>
  )
}

const ICONO_CALENDARIO = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
)

// Una fila de la tabla en escritorio (lg+) o una tarjeta en el celular (Figma, vista móvil)
function FilaTorneo({ torneo, onAccion }) {
  const menu = <MenuAcciones etiqueta={`Acciones de ${torneo.nombre}`} items={itemsDelMenu(torneo, onAccion)} />
  const subtitulo = `${torneo.categoria} · ${ETIQUETA_DISCIPLINA[torneo.disciplina]}`

  // El nombre lleva a la ficha del torneo (M3-FE-03)
  const nombre = (
    <Link to={`${RUTA}/${torneo.id}`} className="hover:text-viper transition-colors focus-visible:outline-2 focus-visible:outline-viper rounded">
      {torneo.nombre}
    </Link>
  )

  return (
    <li className="border-gray-800 max-lg:border max-lg:rounded-2xl max-lg:bg-panel lg:border-b lg:last:border-b-0">
      {/* Escritorio */}
      <div className="hidden lg:grid grid-cols-[minmax(0,1fr)_7rem_6rem_12rem_2.25rem] xl:grid-cols-[minmax(0,1fr)_10rem_7.5rem_6.5rem_6rem_12rem_2.25rem] items-center gap-x-4 px-6 py-4 hover:bg-fondo/50 transition-colors">
        <div className="min-w-0">
          <p className="truncate">{nombre}</p>
          <p className="text-sm text-texto-suave truncate">{subtitulo}</p>
        </div>
        <span className="hidden xl:block text-sm">{ETIQUETA_FORMATO[torneo.formato]}</span>
        <span className="text-sm tabular-nums whitespace-nowrap">{rangoFechas(torneo.fechaInicio, torneo.fechaFin)}</span>
        <Cupo torneo={torneo} />
        <span className="hidden xl:block text-sm tabular-nums whitespace-nowrap">{precio(torneo.precioInscripcion)}</span>
        <span>
          <EstadoBadge tipo="torneo" estado={torneo.estado} />
        </span>
        {menu}
      </div>

      {/* Celular y tablet */}
      <div className="lg:hidden p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-lg truncate">{nombre}</p>
            <p className="text-sm text-texto-suave truncate">{subtitulo}</p>
          </div>
          {menu}
        </div>
        <div>
          <EstadoBadge tipo="torneo" estado={torneo.estado} />
        </div>
        <div className="flex items-end justify-between gap-3">
          <span className="flex items-center gap-2 text-sm text-texto-suave tabular-nums">
            {ICONO_CALENDARIO}
            <span className="text-texto">{rangoFechas(torneo.fechaInicio, torneo.fechaFin)}</span>
          </span>
          <Cupo torneo={torneo} />
        </div>
      </div>
    </li>
  )
}

// Listado de torneos para Organizador y Administrador. Pestaña, filtros, búsqueda y página viven
// en la URL (?vista=&estado=&disciplina=&q=&pagina=) para poder recargar o compartir.
// La API filtra por pestaña, estado y disciplina; la búsqueda por nombre, el orden y la paginación se hacen acá
// porque el club tiene pocos torneos.
export default function GestionTorneos() {
  const [parametros, setParametros] = useSearchParams()
  const vista = parametros.get('vista') === 'historicos' ? 'historicos' : 'activos'
  const estadoPedido = parametros.get('estado') ?? ''
  const estado = VISTAS[vista].includes(estadoPedido) ? estadoPedido : ''
  const disciplina = ETIQUETA_DISCIPLINA[parametros.get('disciplina')] ? parametros.get('disciplina') : ''
  const q = parametros.get('q') ?? ''
  const paginaPedida = Math.max(1, Number(parametros.get('pagina')) || 1)

  const [reintento, setReintento] = useState(0)
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false)
  const [accion, setAccion] = useState(null) // { tipo, torneo }

  // Última respuesta y a qué consulta corresponde (mismo patrón que el listado de usuarios)
  const [resultado, setResultado] = useState(null) // { clave, torneos, error }
  const clave = `${vista}|${estado}|${disciplina}|${reintento}`
  const cargando = resultado?.clave !== clave
  const torneos = resultado?.torneos ?? null
  const error = resultado?.clave === clave ? resultado.error : null

  useEffect(() => {
    let vigente = true
    const consulta = new URLSearchParams({ vista })
    if (estado) consulta.set('estado', estado)
    if (disciplina) consulta.set('disciplina', disciplina)
    get(`/torneos?${consulta}`)
      .then((respuesta) => vigente && setResultado({ clave, torneos: respuesta.torneos }))
      .catch((e) => vigente && setResultado((anterior) => ({ clave, torneos: anterior?.torneos, error: e.mensaje })))
    return () => {
      vigente = false
    }
  }, [clave, vista, estado, disciplina])

  // Cambia parámetros en la URL. Cualquier cambio de filtro vuelve a la página 1.
  // La búsqueda reemplaza la entrada del historial para no llenarlo con cada letra.
  const actualizar = (cambios, { reemplazar = false } = {}) => {
    const nuevos = new URLSearchParams(parametros)
    for (const [nombre, valor] of Object.entries({ pagina: '', ...cambios })) {
      if (valor) nuevos.set(nombre, valor)
      else nuevos.delete(nombre)
    }
    setParametros(nuevos, { replace: reemplazar })
  }

  const cerrarAccion = useCallback(() => setAccion(null), [])
  const cerrarFiltros = useCallback(() => setFiltrosAbiertos(false), [setFiltrosAbiertos])
  const recargar = useCallback(() => setReintento((n) => n + 1), [])
  const abrirAccion = (tipo, torneo) => setAccion({ tipo, torneo })

  const busqueda = normalizar(q)
  const filtrados = torneos
    ? torneos.filter((t) => normalizar(t.nombre).includes(busqueda)).sort(porEstadoYFecha)
    : []
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / TAMANIO))
  const pagina = Math.min(paginaPedida, totalPaginas)
  const desde = (pagina - 1) * TAMANIO
  const visibles = filtrados.slice(desde, desde + TAMANIO)

  const hayFiltros = Boolean(q || estado || disciplina)
  const limpiarFiltros = () => setParametros(vista === 'historicos' ? { vista } : {})
  const cantidadFiltros = (estado ? 1 : 0) + (disciplina ? 1 : 0)

  const selectEstado = (
    <Select aria-label="Filtrar por estado" opciones={opcionesEstado(vista)} value={estado} onChange={(e) => actualizar({ estado: e.target.value })} className="lg:w-56" />
  )
  const selectDisciplina = (
    <Select aria-label="Filtrar por disciplina" opciones={OPCIONES_DISCIPLINA} value={disciplina} onChange={(e) => actualizar({ disciplina: e.target.value })} className="lg:w-56" />
  )

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 pb-24 lg:pb-0">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-outfit text-[28px] font-bold">Torneos y Ligas</h1>
          <p className="text-texto-suave text-sm mt-1">Gestioná los eventos competitivos del club</p>
        </div>
        <Link
          to={`${RUTA}/nuevo`}
          className="hidden lg:block font-outfit font-semibold bg-viper hover:bg-viper-hover text-black px-6 py-3 rounded-lg whitespace-nowrap transition-colors shadow-[0_0_20px_rgba(16,185,129,0.3)]"
        >
          + Crear nuevo evento
        </Link>
      </div>

      <Tabs pestanas={PESTANAS} activa={vista} onCambiar={(clave) => setParametros(clave === 'historicos' ? { vista: clave } : {})} />

      <div className="flex gap-3 lg:items-center">
        <div className="relative flex-1 lg:max-w-md">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-texto-suave pointer-events-none" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            aria-label="Buscar por nombre"
            placeholder="Buscar por nombre"
            maxLength={100}
            value={q}
            onChange={(e) => actualizar({ q: e.target.value }, { reemplazar: true })}
            className="w-full bg-fondo text-texto placeholder:text-texto-suave border border-gray-800 focus:border-viper rounded-lg pl-11 pr-4 py-3 text-sm focus:outline-none transition-colors"
          />
        </div>
        {/* Escritorio: los dos filtros a la vista. Celular: un botón que abre los filtros abajo. */}
        <div className="hidden lg:flex gap-3">
          {selectEstado}
          {selectDisciplina}
        </div>
        <button
          type="button"
          onClick={() => setFiltrosAbiertos(true)}
          aria-label={cantidadFiltros ? `Filtros (${cantidadFiltros} activos)` : 'Filtros'}
          className="lg:hidden relative w-12 shrink-0 flex items-center justify-center bg-panel border border-gray-800 rounded-lg text-texto-suave hover:border-viper hover:text-viper transition-colors cursor-pointer"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M4 6h16M7 12h10M10 18h4" />
          </svg>
          {cantidadFiltros > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-viper" aria-hidden="true" />}
        </button>
      </div>

      {error ? (
        <Alert variante="error" titulo="No pudimos cargar los torneos">
          {error}{' '}
          <button type="button" onClick={recargar} className="underline font-semibold cursor-pointer">
            Reintentar
          </button>
        </Alert>
      ) : !torneos ? (
        <div className="py-16 flex justify-center">
          <Spinner texto="Cargando torneos" />
        </div>
      ) : filtrados.length === 0 ? (
        hayFiltros ? (
          <EmptyState
            titulo="No encontramos torneos"
            descripcion="Probá con otro nombre o quitá los filtros."
            accion={<Button variante="secundario" onClick={limpiarFiltros}>Limpiar filtros</Button>}
          />
        ) : vista === 'activos' ? (
          <EmptyState
            titulo="Todavía no hay torneos activos"
            descripcion="Creá un evento para empezar a recibir inscripciones."
            accion={
              <Link to={`${RUTA}/nuevo`} className="font-outfit font-semibold bg-viper hover:bg-viper-hover text-black px-6 py-3 rounded-lg transition-colors">
                + Crear nuevo evento
              </Link>
            }
          />
        ) : (
          <EmptyState titulo="Todavía no hay torneos históricos" descripcion="Acá vas a ver los torneos finalizados, cancelados y archivados." />
        )
      ) : (
        <div className={`lg:bg-panel lg:border lg:border-gray-800 lg:rounded-2xl transition-opacity ${cargando ? 'opacity-60' : ''}`} aria-busy={cargando}>
          <div className="hidden lg:grid grid-cols-[minmax(0,1fr)_7rem_6rem_12rem_2.25rem] xl:grid-cols-[minmax(0,1fr)_10rem_7.5rem_6.5rem_6rem_12rem_2.25rem] gap-x-4 px-6 py-4 border-b border-gray-800 text-xs font-semibold uppercase tracking-wide text-texto-suave">
            <span>Evento</span>
            <span className="hidden xl:block">Formato</span>
            <span>Fechas</span>
            <span>Inscriptos</span>
            <span className="hidden xl:block">Precio</span>
            <span>Estado</span>
          </div>
          <ul className="flex flex-col gap-4 lg:gap-0">
            {visibles.map((torneo) => (
              <FilaTorneo key={torneo.id} torneo={torneo} onAccion={abrirAccion} />
            ))}
          </ul>

          <div className="flex items-center justify-between gap-3 mt-4 lg:mt-0 lg:px-6 lg:py-4 lg:border-t lg:border-gray-800">
            <p className="text-sm text-texto-suave tabular-nums" aria-live="polite">
              {desde + 1}–{desde + visibles.length} de {filtrados.length}
            </p>
            {totalPaginas > 1 && (
              <nav aria-label="Paginación" className="flex gap-2">
                <button type="button" aria-label="Página anterior" disabled={pagina <= 1} onClick={() => actualizar({ ...Object.fromEntries(parametros), pagina: String(pagina - 1) })} className="w-10 h-10 flex items-center justify-center bg-panel border border-gray-800 rounded-lg hover:border-viper disabled:opacity-40 disabled:hover:border-gray-800 cursor-pointer disabled:cursor-not-allowed transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
                </button>
                <button type="button" aria-label="Página siguiente" disabled={pagina >= totalPaginas} onClick={() => actualizar({ ...Object.fromEntries(parametros), pagina: String(pagina + 1) })} className="w-10 h-10 flex items-center justify-center bg-panel border border-gray-800 rounded-lg hover:border-viper disabled:opacity-40 disabled:hover:border-gray-800 cursor-pointer disabled:cursor-not-allowed transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
                </button>
              </nav>
            )}
          </div>
        </div>
      )}

      {/* Celular: botón flotante para crear (Figma, vista móvil) */}
      <Link
        to={`${RUTA}/nuevo`}
        aria-label="Crear nuevo evento"
        className="lg:hidden fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full bg-viper hover:bg-viper-hover text-black flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-colors"
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </Link>

      <BottomSheet abierto={filtrosAbiertos} titulo="Filtros" onCerrar={cerrarFiltros}>
        <div className="flex flex-col gap-3">
          {selectEstado}
          {selectDisciplina}
          <Button className="mt-3" onClick={() => setFiltrosAbiertos(false)}>
            Ver resultados
          </Button>
        </div>
      </BottomSheet>

      <ConfirmarAccionTorneo accion={accion?.tipo ?? null} torneo={accion?.torneo ?? null} onCerrar={cerrarAccion} onHecho={recargar} />
    </div>
  )
}