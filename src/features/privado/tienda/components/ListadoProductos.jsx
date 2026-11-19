import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { get } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import Button from '../../../../shared/components/Button'
import EstadoBadge from '../../../../shared/components/EstadoBadge'
import Paginacion from '../../../../shared/components/Paginacion'
import Select from '../../../../shared/components/Select'
import Spinner from '../../../../shared/components/Spinner'
import { precio } from '../../torneos/torneos'
import { ETIQUETA_CATEGORIA, OPCIONES_CATEGORIA_PRODUCTO, OPCIONES_ESTADO_PRODUCTO, RUTA_NUEVO_PRODUCTO, claseStock, rutaEditarProducto, textoStock } from '../tienda'
import ImagenProducto from './ImagenProducto'
import SinResultadosProductos from './SinResultadosProductos'

const TAMANIO = 10
const ESPERA_BUSQUEDA = 350 // ms sin tipear antes de buscar (debounce)
// En pantallas muy anchas (xl) el alquiler por turno tiene su propia columna; en las más angostas va debajo del nombre
const COLUMNAS = 'md:grid-cols-[minmax(0,1fr)_6rem_7.5rem_5.5rem_6rem_4rem] xl:grid-cols-[minmax(0,1fr)_6rem_7.5rem_8.5rem_5.5rem_6rem_4rem]'

// En el celular cada producto es una tarjeta: foto, nombre y categoría; debajo el estado y el precio con el stock.
function FilaProducto({ producto }) {
  const alquiler = producto.disponibleParaAlquiler ? precio(producto.precioAlquiler) : null
  return (
    <li className={`grid grid-cols-[auto_minmax(0,1fr)] ${COLUMNAS} items-center gap-x-4 gap-y-2 bg-panel border border-gray-800 rounded-xl px-4 md:px-6 py-3 ${producto.activo ? '' : 'opacity-70'}`}>
      <div className="contents md:flex md:items-center md:gap-3 md:min-w-0">
        <ImagenProducto key={producto.imagenUrl ?? 'sin-imagen'} url={producto.imagenUrl} />
        <div className="min-w-0">
          <p className="text-sm truncate">{producto.nombre}</p>
          <p className="md:hidden text-xs text-texto-suave">{ETIQUETA_CATEGORIA[producto.categoria]}</p>
          {alquiler && <p className="xl:hidden text-xs text-texto-suave mt-1 truncate">Alquiler por turno: {alquiler}</p>}
          <div className="md:hidden flex flex-wrap items-center gap-x-3 gap-y-2 mt-2">
            <EstadoBadge tipo="producto" estado={producto.activo ? 'ACTIVO' : 'INACTIVO'} />
            <span className="text-sm tabular-nums">{precio(producto.precio)}</span>
            <span className={`text-sm tabular-nums ${claseStock(producto.stockActual)}`}>
              {producto.stockActual === 0 ? textoStock(0) : `Stock: ${textoStock(producto.stockActual)}`}
            </span>
            <Link to={rutaEditarProducto(producto.id)} aria-label={`Editar ${producto.nombre}`} className="text-sm text-viper hover:underline ml-auto">
              Editar
            </Link>
          </div>
        </div>
      </div>
      <span className="hidden md:block text-sm truncate">{ETIQUETA_CATEGORIA[producto.categoria]}</span>
      <span className="hidden md:block text-sm tabular-nums">{precio(producto.precio)}</span>
      <span className="hidden xl:block text-sm tabular-nums">{alquiler ?? '—'}</span>
      <span className={`hidden md:block text-sm tabular-nums ${claseStock(producto.stockActual)}`}>{textoStock(producto.stockActual)}</span>
      <div className="hidden md:block">
        <EstadoBadge tipo="producto" estado={producto.activo ? 'ACTIVO' : 'INACTIVO'} />
      </div>
      <Link to={rutaEditarProducto(producto.id)} aria-label={`Editar ${producto.nombre}`} className="hidden md:block text-sm text-viper hover:underline text-right">
        Editar
      </Link>
    </li>
  )
}

// Pestaña «Catálogo» (solo Administrador). Los filtros viven en la URL (?q=&categoria=&estado=&pagina=) para poder recargar
// o compartir la búsqueda.
export default function ListadoProductos() {
  const navigate = useNavigate()
  const [parametros, setParametros] = useSearchParams()
  const q = parametros.get('q') ?? ''
  const categoria = parametros.get('categoria') ?? ''
  const estado = parametros.get('estado') ?? ''
  const pagina = Math.max(1, Number(parametros.get('pagina')) || 1)

  const [busqueda, setBusqueda] = useState(q)
  const [reintento, setReintento] = useState(0)
  // Última respuesta recibida y a qué consulta corresponde. Mientras la consulta actual no coincide con
  // `resultado.clave`, se está cargando y se sigue mostrando la lista anterior atenuada.
  const [resultado, setResultado] = useState(null) // { clave, datos, error }
  const clave = `${q}|${categoria}|${estado}|${pagina}|${reintento}`
  const cargando = resultado?.clave !== clave
  const datos = resultado?.datos ?? null // { productos, total, totalPaginas }
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
  }, [busqueda, q])

  useEffect(() => {
    let vigente = true // si cambian los filtros antes de que responda, se ignora la respuesta vieja
    const consulta = new URLSearchParams({ pagina: String(pagina), tamanio: String(TAMANIO) })
    if (q) consulta.set('q', q)
    if (categoria) consulta.set('categoria', categoria)
    if (estado) consulta.set('estado', estado)
    get(`/productos?${consulta}`)
      .then((respuesta) => vigente && setResultado({ clave, datos: respuesta }))
      .catch((e) => vigente && setResultado((anterior) => ({ clave, datos: anterior?.datos, error: e.mensaje })))
    return () => {
      vigente = false
    }
  }, [clave, q, categoria, estado, pagina])

  const hayFiltros = Boolean(q || categoria || estado)
  const limpiarFiltros = () => {
    setBusqueda('')
    setParametros(new URLSearchParams())
  }

  const botonNuevo = (
    <Button onClick={() => navigate(RUTA_NUEVO_PRODUCTO)} className="w-full md:w-auto">
      Nuevo producto
    </Button>
  )

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
            aria-label="Buscar por nombre"
            placeholder="Buscar por nombre"
            maxLength={100}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-fondo text-texto placeholder:text-texto-suave border border-gray-800 focus:border-viper rounded-lg pl-11 pr-4 py-3 text-sm focus:outline-none transition-colors"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:flex">
          <Select aria-label="Filtrar por categoría" opciones={OPCIONES_CATEGORIA_PRODUCTO} value={categoria} onChange={(e) => actualizar({ categoria: e.target.value })} className="lg:w-48" />
          <Select aria-label="Filtrar por estado" opciones={OPCIONES_ESTADO_PRODUCTO} value={estado} onChange={(e) => actualizar({ estado: e.target.value })} className="lg:w-44" />
        </div>
        {/* En el celular el botón queda fijo abajo */}
        <div className="fixed bottom-0 inset-x-0 p-4 bg-fondo/90 backdrop-blur border-t border-gray-800 z-30 md:static md:p-0 md:bg-transparent md:border-0 md:backdrop-blur-none lg:ml-auto">
          {botonNuevo}
        </div>
      </div>

      {error ? (
        <Alert variante="error" titulo="No pudimos cargar el catálogo">
          {error}{' '}
          <button type="button" onClick={() => setReintento((n) => n + 1)} className="underline font-semibold cursor-pointer">
            Reintentar
          </button>
        </Alert>
      ) : !datos ? (
        <div className="py-16 flex justify-center">
          <Spinner texto="Cargando productos" />
        </div>
      ) : datos.productos.length === 0 ? (
        <SinResultadosProductos hayFiltros={hayFiltros} onLimpiar={limpiarFiltros} accion={botonNuevo} />
      ) : (
        <div className={`flex flex-col gap-3 transition-opacity ${cargando ? 'opacity-60' : ''}`} aria-busy={cargando}>
          {datos.totalPaginas > 1 && <Paginacion pagina={pagina} totalPaginas={datos.totalPaginas} onCambiar={(n) => actualizar({ pagina: String(n) })} etiqueta="Paginación superior" />}
          <div className={`hidden md:grid ${COLUMNAS} gap-x-4 px-6 text-xs font-bold uppercase tracking-wide text-texto-suave`}>
            <span>Producto</span>
            <span>Categoría</span>
            <span>Precio</span>
            <span className="hidden xl:block">Alquiler por turno</span>
            <span>Stock</span>
            <span>Estado</span>
            <span className="sr-only">Acciones</span>
          </div>
          <ul className="flex flex-col gap-3">
            {datos.productos.map((producto) => (
              <FilaProducto key={producto.id} producto={producto} />
            ))}
          </ul>

          <Paginacion
            pagina={pagina}
            totalPaginas={datos.totalPaginas}
            onCambiar={(n) => actualizar({ pagina: String(n) })}
            resumen={`Mostrando ${datos.productos.length} de ${datos.total} ${datos.total === 1 ? 'producto' : 'productos'}`}
            className="mt-2"
          />
        </div>
      )}
    </div>
  )
}
