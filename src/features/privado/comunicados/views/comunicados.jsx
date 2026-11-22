import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { get } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import Button from '../../../../shared/components/Button'
import EmptyState from '../../../../shared/components/EmptyState'
import EstadoBadge from '../../../../shared/components/EstadoBadge'
import Paginacion from '../../../../shared/components/Paginacion'
import Select from '../../../../shared/components/Select'
import Spinner from '../../../../shared/components/Spinner'
import { OPCIONES_ESTADO, cantidadComunicados, fechaYHora, nombreDelAutor } from '../comunicados'

const RUTA = '/gestion/comunicados'
const TAMANIO = 10
const ESPERA_BUSQUEDA = 350 // ms sin tipear antes de buscar (debounce)
const COLUMNAS = 'md:grid-cols-[minmax(0,1fr)_7rem_7rem_11rem_9.5rem]'

// Fila del listado. En el celular los datos van en una tarjeta: título, insignias y debajo autor y fecha.
function FilaComunicado({ comunicado }) {
  return (
    <li className={`grid grid-cols-1 ${COLUMNAS} items-center gap-x-4 gap-y-2 bg-panel border border-gray-800 rounded-xl px-4 md:px-6 py-3`}>
      <p className="text-sm font-semibold break-words min-w-0">{comunicado.titulo}</p>
      <div className="flex flex-wrap gap-2 md:contents">
        <div><EstadoBadge tipo="alcanceComunicado" estado={comunicado.alcance} /></div>
        <div><EstadoBadge tipo="comunicado" estado={comunicado.estado} /></div>
      </div>
      <p className="text-xs md:text-sm text-texto-suave md:text-texto truncate">
        <span className="md:hidden">Autor: </span>
        {nombreDelAutor(comunicado.autor)}
      </p>
      <p className="text-xs md:text-sm text-texto-suave md:text-texto tabular-nums">
        <span className="md:hidden">Publicación: </span>
        {fechaYHora(comunicado.fechaPublicacion)}
      </p>
    </li>
  )
}

// Comunicados oficiales (solo Administrador). Los filtros viven en la URL (?q=&estado=&pagina=) para poder recargar o compartir la búsqueda.
export default function Comunicados() {
  const [parametros, setParametros] = useSearchParams()
  const q = parametros.get('q') ?? ''
  const estado = parametros.get('estado') ?? ''
  const pagina = Math.max(1, Number(parametros.get('pagina')) || 1)

  const [busqueda, setBusqueda] = useState(q)
  const [reintento, setReintento] = useState(0)
  // Última respuesta y a qué consulta corresponde: mientras la consulta actual no coincide, se está cargando y se
  // sigue mostrando la lista anterior atenuada.
  const [resultado, setResultado] = useState(null) // { clave, datos, error }
  const clave = `${q}|${estado}|${pagina}|${reintento}`
  const cargando = resultado?.clave !== clave
  const datos = resultado?.datos ?? null // { comunicados, total, totalPaginas }
  const error = resultado?.clave === clave ? resultado.error : null

  // Cualquier cambio de filtro vuelve a la página 1
  const actualizar = (cambios) => {
    const nuevos = new URLSearchParams(parametros)
    for (const [campo, valor] of Object.entries({ pagina: '', ...cambios })) {
      if (valor) nuevos.set(campo, valor)
      else nuevos.delete(campo)
    }
    setParametros(nuevos)
  }

  // Si la URL cambia desde afuera (atrás/adelante), el buscador la sigue; si el cambio vino de lo que se está tipeando, no se toca
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
  }, [busqueda, q])

  useEffect(() => {
    let vigente = true // si cambian los filtros antes de que responda, se ignora la respuesta vieja
    const consulta = new URLSearchParams({ pagina: String(pagina), tamanio: String(TAMANIO) })
    if (q) consulta.set('q', q)
    if (estado) consulta.set('estado', estado)
    get(`/comunicados?${consulta}`)
      .then((respuesta) => vigente && setResultado({ clave, datos: respuesta }))
      .catch((e) => vigente && setResultado((anterior) => ({ clave, datos: anterior?.datos, error: e.mensaje })))
    return () => {
      vigente = false
    }
  }, [clave, q, estado, pagina])

  const hayFiltros = Boolean(q || estado)
  const limpiarFiltros = () => {
    setBusqueda('')
    setParametros(new URLSearchParams())
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-outfit text-[28px] font-bold">Comunicados</h1>
          <p className="text-texto-suave text-sm mt-1">Novedades oficiales que se muestran en la cartelera del Portal del Jugador</p>
        </div>
        <Link
          to={`${RUTA}/nuevo`}
          className="hidden lg:inline-flex shrink-0 items-center justify-center px-6 py-2 rounded-lg font-semibold bg-viper hover:bg-viper-hover text-sobre-viper shadow-[0_0_20px_var(--glow-primary)] transition-colors"
        >
          + Nuevo comunicado
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 md:max-w-md">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-texto-suave pointer-events-none" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            aria-label="Buscar por título"
            placeholder="Buscar por título"
            maxLength={100}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-fondo text-texto placeholder:text-texto-suave border border-gray-800 focus:border-viper rounded-lg pl-11 pr-4 py-3 text-sm focus:outline-none transition-colors"
          />
        </div>
        <Select aria-label="Filtrar por estado" opciones={OPCIONES_ESTADO} value={estado} onChange={(e) => actualizar({ estado: e.target.value })} className="md:w-48" />
      </div>

      {error ? (
        <Alert variante="error" titulo="No pudimos cargar los comunicados">
          {error}{' '}
          <Button variante="neutro" onClick={() => setReintento((n) => n + 1)} className="ml-2">Reintentar</Button>
        </Alert>
      ) : !datos ? (
        <div className="py-16 flex justify-center"><Spinner texto="Cargando los comunicados" /></div>
      ) : datos.comunicados.length === 0 && !hayFiltros ? (
        <EmptyState
          titulo="Todavía no hay comunicados"
          descripcion="Redactá el primero para que aparezca en la cartelera del Portal del Jugador."
          accion={<Link to={`${RUTA}/nuevo`} className="inline-flex items-center justify-center px-6 py-2 rounded-lg font-semibold bg-viper hover:bg-viper-hover text-sobre-viper transition-colors">Redactar el primero</Link>}
        />
      ) : datos.comunicados.length === 0 ? (
        <EmptyState
          titulo="No se encontraron resultados"
          descripcion="Ningún comunicado coincide con la búsqueda o el filtro."
          accion={<Button variante="secundario" onClick={limpiarFiltros}>Limpiar filtros</Button>}
        />
      ) : (
        <div className={`flex flex-col gap-3 transition-opacity ${cargando ? 'opacity-60' : ''}`} aria-busy={cargando}>
          {datos.totalPaginas > 1 && <Paginacion pagina={pagina} totalPaginas={datos.totalPaginas} onCambiar={(n) => actualizar({ pagina: String(n) })} etiqueta="Paginación superior" />}
          <div className={`hidden md:grid ${COLUMNAS} gap-x-4 px-6 text-xs font-bold uppercase tracking-wide text-texto-suave`}>
            <span>Título</span>
            <span>Alcance</span>
            <span>Estado</span>
            <span>Autor</span>
            <span>Publicación</span>
          </div>
          <ul className="flex flex-col gap-3">
            {datos.comunicados.map((c) => (
              <FilaComunicado key={c.id} comunicado={c} />
            ))}
          </ul>
          <Paginacion
            pagina={pagina}
            totalPaginas={datos.totalPaginas}
            onCambiar={(n) => actualizar({ pagina: String(n) })}
            resumen={`Mostrando ${datos.comunicados.length} de ${cantidadComunicados(datos.total)}`}
            className="mt-2"
          />
        </div>
      )}

      <Link
        to={`${RUTA}/nuevo`}
        aria-label="Nuevo comunicado"
        className="lg:hidden fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full bg-viper hover:bg-viper-hover text-sobre-viper flex items-center justify-center shadow-[0_0_20px_var(--glow-primary)] transition-colors"
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </Link>
    </div>
  )
}