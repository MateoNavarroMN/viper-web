import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { get } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import Avatar from '../../../../shared/components/Avatar'
import Button from '../../../../shared/components/Button'
import EstadoBadge from '../../../../shared/components/EstadoBadge'
import Select from '../../../../shared/components/Select'
import Spinner from '../../../../shared/components/Spinner'
import { fechaCompleta } from '../../torneos/torneos'
import { OPCIONES_CUOTAS_SOCIO, OPCIONES_ESTADO_SOCIO, dniConPuntos } from '../socios'
import SinResultadosSocios from './SinResultadosSocios'

const TAMANIO = 10
const ESPERA_BUSQUEDA = 350 // ms sin tipear antes de buscar (debounce)
const COLUMNAS = 'md:grid-cols-[minmax(0,1fr)_9rem_8rem_8rem] xl:grid-cols-[minmax(0,1fr)_7rem_5.5rem_6.5rem_7rem_7rem]'

// Fila del listado; abre la ficha del socio. En el celular los datos van en una tarjeta: nombre, DNI y alta, y debajo las insignias.
function FilaSocio({ socio }) {
  return (
    <li>
      <Link
        to={`/gestion/socios/${socio.id}`}
        className={`grid grid-cols-[auto_minmax(0,1fr)] ${COLUMNAS} items-center gap-x-4 gap-y-2 bg-panel border border-gray-800 hover:border-viper rounded-xl px-4 md:px-6 py-3 transition-colors focus-visible:outline-2 focus-visible:outline-viper`}
      >
        <div className="contents md:flex md:items-center md:gap-3 md:min-w-0">
          <Avatar semilla={socio.jugadorId} tamano={36} />
          <div className="min-w-0">
            <p className="text-sm truncate">
              {socio.nombre} {socio.apellido}
            </p>
            <p className="text-xs text-texto-suave truncate">
              DNI {dniConPuntos(socio.dni)}
              <span className="md:hidden"> · Alta {fechaCompleta(socio.fechaAlta)}</span>
            </p>
            <div className="md:hidden flex flex-wrap gap-2 mt-2">
              <EstadoBadge tipo="socio" estado={socio.estado} />
              <EstadoBadge tipo="cuotasSocio" estado={socio.situacionCuotas} />
            </div>
            <p className="xl:hidden text-xs text-texto-suave mt-2 truncate">
              Tenis: {socio.categorias.TENIS?.nombre ?? '—'} · Pádel: {socio.categorias.PADEL?.nombre ?? '—'}
            </p>
          </div>
        </div>
        <span className="hidden md:block text-sm tabular-nums">{fechaCompleta(socio.fechaAlta)}</span>
        <div className="hidden md:block">
          <EstadoBadge tipo="socio" estado={socio.estado} />
        </div>
        <div className="hidden md:block">
          <EstadoBadge tipo="cuotasSocio" estado={socio.situacionCuotas} />
        </div>
        <span className="hidden xl:block text-sm truncate">{socio.categorias.TENIS?.nombre ?? '—'}</span>
        <span className="hidden xl:block text-sm truncate">{socio.categorias.PADEL?.nombre ?? '—'}</span>
      </Link>
    </li>
  )
}

// CU 4.1 · pestaña «Socios». Los filtros viven en la URL (?q=&estado=&cuotas=&pagina=) para poder recargar o compartir
// la búsqueda.
export default function ListadoSocios() {
  const [parametros, setParametros] = useSearchParams()
  const q = parametros.get('q') ?? ''
  const estado = parametros.get('estado') ?? ''
  const cuotas = parametros.get('cuotas') ?? ''
  const pagina = Math.max(1, Number(parametros.get('pagina')) || 1)

  const [busqueda, setBusqueda] = useState(q)
  const [reintento, setReintento] = useState(0)
  // Última respuesta recibida y a qué consulta corresponde. Mientras la consulta actual no coincide con
  // `resultado.clave`, se está cargando y se sigue mostrando la lista anterior atenuada.
  const [resultado, setResultado] = useState(null) // { clave, datos, error }
  const clave = `${q}|${estado}|${cuotas}|${pagina}|${reintento}`
  const cargando = resultado?.clave !== clave
  const datos = resultado?.datos ?? null // { socios, total, totalPaginas }
  const error = resultado?.clave === clave ? resultado.error : null

  // Cambia filtros en la URL. Cualquier cambio de filtro vuelve a la página 1.
  const actualizar = (cambios) => {
    const nuevos = new URLSearchParams(parametros)
    for (const [campo, valor] of Object.entries({ pagina: '', ...cambios })) {
      if (valor) nuevos.set(campo, valor)
      else nuevos.delete(campo)
    }
    setParametros(nuevos)
  }

  // Si la URL cambia desde afuera (atrás/adelante del navegador), el buscador la sigue. Si el cambio vino de lo
  // que se está tipeando (busqueda.trim() === q) no se toca, para no pisar un espacio recién escrito.
  const [qPrevia, setQPrevia] = useState(q)
  if (q !== qPrevia) {
    setQPrevia(q)
    if (q !== busqueda.trim()) setBusqueda(q)
  }

  // Debounce: busca cuando se deja de tipear
  useEffect(() => {
    if (busqueda.trim() === q) return undefined
    const espera = setTimeout(() => actualizar({ q: busqueda.trim() }), ESPERA_BUSQUEDA)
    return () => clearTimeout(espera)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda])

  useEffect(() => {
    let vigente = true // si cambian los filtros antes de que responda, se ignora la respuesta vieja
    const consulta = new URLSearchParams({ pagina: String(pagina), tamanio: String(TAMANIO) })
    if (q) consulta.set('q', q)
    if (estado) consulta.set('estado', estado)
    if (cuotas) consulta.set('cuotas', cuotas)
    get(`/socios?${consulta}`)
      .then((respuesta) => vigente && setResultado({ clave, datos: respuesta }))
      .catch((e) => vigente && setResultado((anterior) => ({ clave, datos: anterior?.datos, error: e.mensaje })))
    return () => {
      vigente = false
    }
  }, [clave, q, estado, cuotas, pagina])

  const hayFiltros = Boolean(q || estado || cuotas)
  const limpiarFiltros = () => {
    setBusqueda('')
    setParametros(new URLSearchParams())
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
        <div className="relative flex-1 lg:max-w-md">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-texto-suave pointer-events-none" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            aria-label="Buscar por nombre o DNI"
            placeholder="Buscar por nombre o DNI"
            maxLength={100}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-fondo text-texto placeholder:text-texto-suave border border-gray-800 focus:border-viper rounded-lg pl-11 pr-4 py-3 text-sm focus:outline-none transition-colors"
          />
        </div>
        <div className="grid grid-cols-2 gap-3 lg:flex">
          <Select aria-label="Filtrar por estado" opciones={OPCIONES_ESTADO_SOCIO} value={estado} onChange={(e) => actualizar({ estado: e.target.value })} className="lg:w-44" />
          <Select aria-label="Filtrar por situación de cuotas" opciones={OPCIONES_CUOTAS_SOCIO} value={cuotas} onChange={(e) => actualizar({ cuotas: e.target.value })} className="lg:w-44" />
        </div>
        {/* En el celular el botón queda fijo abajo */}
        <div className="fixed bottom-0 inset-x-0 p-4 bg-fondo/90 backdrop-blur border-t border-gray-800 z-30 md:static md:p-0 md:bg-transparent md:border-0 md:backdrop-blur-none lg:ml-auto">
          <Link
            to="/gestion/socios/nuevo"
            className="font-outfit font-semibold bg-viper hover:bg-viper-hover text-sobre-viper px-6 py-3 rounded-lg text-center block transition-colors"
          >
            Registrar socio
          </Link>
        </div>
      </div>

      {error ? (
        <Alert variante="error" titulo="No pudimos cargar los socios">
          {error}{' '}
          <button type="button" onClick={() => setReintento((n) => n + 1)} className="underline font-semibold cursor-pointer">
            Reintentar
          </button>
        </Alert>
      ) : !datos ? (
        <div className="py-16 flex justify-center">
          <Spinner texto="Cargando socios" />
        </div>
      ) : datos.socios.length === 0 ? (
        <SinResultadosSocios hayFiltros={hayFiltros} onLimpiar={limpiarFiltros} />
      ) : (
        <div className={`flex flex-col gap-3 transition-opacity ${cargando ? 'opacity-60' : ''}`} aria-busy={cargando}>
          <div className={`hidden md:grid ${COLUMNAS} gap-x-4 px-6 text-xs font-bold uppercase tracking-wide text-texto-suave`}>
            <span>Socio</span>
            <span>Fecha de alta</span>
            <span>Estado</span>
            <span>Cuotas</span>
            <span className="hidden xl:block">Tenis</span>
            <span className="hidden xl:block">Pádel</span>
          </div>
          <ul className="flex flex-col gap-3">
            {datos.socios.map((socio) => (
              <FilaSocio key={socio.id} socio={socio} />
            ))}
          </ul>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-2">
            <p className="text-sm text-texto-suave" aria-live="polite">
              Mostrando {datos.socios.length} de {datos.total} {datos.total === 1 ? 'socio' : 'socios'}
            </p>
            {datos.totalPaginas > 1 && (
              <nav aria-label="Paginación" className="flex items-center gap-3">
                <Button variante="neutro" disabled={pagina <= 1} onClick={() => actualizar({ ...Object.fromEntries(parametros), pagina: String(pagina - 1) })} className="text-sm">
                  Anterior
                </Button>
                <span className="text-sm text-texto-suave tabular-nums">
                  Página {pagina} de {datos.totalPaginas}
                </span>
                <Button variante="neutro" disabled={pagina >= datos.totalPaginas} onClick={() => actualizar({ ...Object.fromEntries(parametros), pagina: String(pagina + 1) })} className="text-sm">
                  Siguiente
                </Button>
              </nav>
            )}
          </div>
        </div>
      )}
    </div>
  )
}