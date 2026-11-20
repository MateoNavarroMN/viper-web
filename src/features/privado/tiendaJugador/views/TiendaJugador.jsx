import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { get } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import Button from '../../../../shared/components/Button'
import Spinner from '../../../../shared/components/Spinner'
import CamposFiltro from '../components/CamposFiltro'
import PanelFiltros from '../components/PanelFiltros'
import ProductoTarjeta from '../components/ProductoTarjeta'
import { aConsulta, aParametros, cantidadDeFiltros, leerFiltros, precioParaCampo, revisarPrecios } from '../tiendaJugador'

const INICIAL = { llave: null, productos: [], total: 0, pagina: 0, hayMas: false, error: null }

// Tienda del Jugador: los productos del club con búsqueda, categoría, rango de precio y orden. Es solo para mirar: la compra y el
// alquiler se hacen en el mostrador. Los filtros viven en la URL (se puede compartir el enlace y «atrás» los respeta) y la lista
// crece de a 12 con «Cargar más».
export default function TiendaJugador() {
  const [parametros, setParametros] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  // Aviso que deja el detalle cuando el producto ya no está disponible. Se guarda acá y se saca de la navegación para que recargar no lo repita.
  const [aviso, setAviso] = useState(() => location.state?.aviso ?? null)
  useEffect(() => {
    if (location.state) navigate(`${location.pathname}${location.search}`, { replace: true, state: null })
  }, [location, navigate])
  const filtros = useMemo(() => leerFiltros(parametros), [parametros])
  const clave = aParametros(filtros).toString()

  const [lista, setLista] = useState(INICIAL)
  const [cargandoMas, setCargandoMas] = useState(false)
  const [errorMas, setErrorMas] = useState(null)
  const [reintento, setReintento] = useState(0)
  const [panelAbierto, setPanelAbierto] = useState(false)

  // La búsqueda se escribe sin esperar a la API: se pasa a la URL (y se pide la lista) cuando se deja de tipear
  const [busqueda, setBusqueda] = useState(filtros.q)
  const [textoMin, setTextoMin] = useState(precioParaCampo(filtros.precioMin))
  const [textoMax, setTextoMax] = useState(precioParaCampo(filtros.precioMax))
  const [errorPrecio, setErrorPrecio] = useState(null)

  const aplicar = (nuevos) => setParametros(aParametros(nuevos), { replace: true })

  // Si la URL cambia desde afuera (botón «atrás», un enlace), los campos se ponen al día
  const [filtrosVistos, setFiltrosVistos] = useState(filtros)
  if (filtrosVistos !== filtros) {
    setFiltrosVistos(filtros)
    if (filtros.q.trim() !== busqueda.trim()) setBusqueda(filtros.q)
    // Solo se reescribe el campo de precio que cambió en la URL (y que no dice ya lo mismo): lo que se está tipiando en el otro no se pisa
    if (filtros.precioMin !== filtrosVistos.precioMin && revisarPrecios(textoMin, '').min !== filtros.precioMin) setTextoMin(precioParaCampo(filtros.precioMin))
    if (filtros.precioMax !== filtrosVistos.precioMax && revisarPrecios('', textoMax).max !== filtros.precioMax) setTextoMax(precioParaCampo(filtros.precioMax))
    if (filtros.precioMin !== filtrosVistos.precioMin || filtros.precioMax !== filtrosVistos.precioMax) setErrorPrecio(null)
  }

  useEffect(() => {
    if (busqueda.trim() === filtros.q.trim()) return
    const espera = setTimeout(() => setParametros(aParametros({ ...filtros, q: busqueda }), { replace: true }), 400)
    return () => clearTimeout(espera)
  }, [busqueda, filtros, setParametros])

  // Primera página: se vuelve a pedir cada vez que cambian los filtros. Mientras llega la nueva lista sigue a la vista la anterior.
  const llave = `${clave}|${reintento}`
  useEffect(() => {
    let vigente = true
    get(`/tienda/catalogo?${aConsulta(leerFiltros(new URLSearchParams(clave)), 1)}`)
      .then((r) => vigente && (setErrorMas(null), setLista({ llave, productos: r.productos, total: r.total, pagina: r.pagina, hayMas: r.hayMas, error: null })))
      .catch((e) => vigente && (setErrorMas(null), setLista({ ...INICIAL, llave, error: e.mensaje })))
    return () => {
      vigente = false
    }
  }, [llave, clave])

  const cargarMas = async () => {
    setCargandoMas(true)
    setErrorMas(null)
    try {
      const r = await get(`/tienda/catalogo?${aConsulta(filtros, lista.pagina + 1)}`)
      setLista((anterior) => {
        const ya = new Set(anterior.productos.map((p) => p.id))
        return { ...anterior, productos: [...anterior.productos, ...r.productos.filter((p) => !ya.has(p.id))], total: r.total, pagina: r.pagina, hayMas: r.hayMas }
      })
    } catch (e) {
      setErrorMas(e.mensaje)
    } finally {
      setCargandoMas(false)
    }
  }

  const aplicarPrecios = () => {
    const precios = revisarPrecios(textoMin, textoMax)
    if (precios.error) return setErrorPrecio(precios.error)
    setErrorPrecio(null)
    if (precios.min !== filtros.precioMin || precios.max !== filtros.precioMax) aplicar({ ...filtros, precioMin: precios.min, precioMax: precios.max })
  }

  const limpiar = () => aplicar({ q: '', categoria: '', precioMin: '', precioMax: '', orden: filtros.orden })
  const hayFiltros = Boolean(filtros.q.trim() || filtros.categoria || filtros.precioMin || filtros.precioMax)
  const { productos, total, hayMas, error } = lista
  const cargando = lista.llave !== llave
  const recargando = cargando && productos.length > 0

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="font-outfit text-[28px] font-bold">Tienda</h1>
        <p className="text-texto-suave text-sm mt-1">Mirá los productos del Pro-Shop y del buffet. La compra y el alquiler se realizan en el mostrador del club.</p>
      </div>

      {aviso && (
        <Alert variante="advertencia">
          {aviso}{' '}
          <button type="button" onClick={() => setAviso(null)} className="underline font-semibold cursor-pointer">
            Entendido
          </button>
        </Alert>
      )}

      <div className="flex flex-col gap-4">
        <div className="flex gap-3">
          <div className="relative flex-1 md:max-w-md">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-texto-suave pointer-events-none" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="search"
              aria-label="Buscar producto"
              placeholder="Buscar producto"
              maxLength={100}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-fondo text-texto placeholder:text-texto-suave border border-gray-800 focus:border-viper rounded-lg pl-11 pr-4 py-3 text-sm focus:outline-none transition-colors"
            />
          </div>
          <Button variante="neutro" className="md:hidden shrink-0" onClick={() => setPanelAbierto(true)}>
            Filtros{cantidadDeFiltros(filtros) > 0 ? ` (${cantidadDeFiltros(filtros)})` : ''}
          </Button>
        </div>

        {/* Escritorio: los filtros a la vista */}
        <div className="hidden md:grid grid-cols-[minmax(0,18rem)_minmax(0,18rem)_minmax(0,1fr)] gap-4 items-start">
          <CamposFiltro
            prefijo="pantalla"
            categoria={filtros.categoria}
            orden={filtros.orden}
            textoMin={textoMin}
            textoMax={textoMax}
            error={errorPrecio}
            onCategoria={(categoria) => aplicar({ ...filtros, categoria })}
            onOrden={(orden) => aplicar({ ...filtros, orden })}
            onMin={(t) => { setTextoMin(t); setErrorPrecio(null) }}
            onMax={(t) => { setTextoMax(t); setErrorPrecio(null) }}
            onPrecioListo={aplicarPrecios}
          />
        </div>
      </div>

      {error && !cargando ? (
        <Alert variante="error" titulo="No pudimos cargar los productos">
          {error}{' '}
          <button type="button" onClick={() => setReintento((n) => n + 1)} className="underline font-semibold cursor-pointer">
            Reintentar
          </button>
        </Alert>
      ) : lista.llave === null || (cargando && productos.length === 0) ? (
        <div className="py-16 flex justify-center">
          <Spinner texto="Cargando productos" />
        </div>
      ) : productos.length === 0 ? (
        <div className="bg-panel border border-gray-800 rounded-2xl px-6 py-12 text-center flex flex-col items-center gap-3">
          <h2 className="font-outfit text-lg font-bold">{hayFiltros ? 'No se encontraron productos' : 'La tienda aún no tiene productos publicados'}</h2>
          <p className="text-texto-suave text-sm">{hayFiltros ? 'Probá con otro nombre o quitá los filtros.' : 'Cuando el club publique productos los vas a ver acá.'}</p>
          {hayFiltros && <Button variante="secundario" onClick={limpiar}>Limpiar filtros</Button>}
        </div>
      ) : (
        <div className={`flex flex-col gap-4 transition-opacity ${recargando ? 'opacity-60' : ''}`} aria-busy={recargando}>
          <p className="text-sm text-texto-suave" aria-live="polite">{total === 1 ? '1 producto' : `${total} productos`}</p>
          <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {productos.map((producto) => (
              <ProductoTarjeta key={producto.id} producto={producto} />
            ))}
          </ul>
          {errorMas && (
            <Alert variante="error" titulo="No pudimos cargar más productos">
              {errorMas}
            </Alert>
          )}
          {hayMas && (
            <div className="flex justify-center">
              <Button variante="secundario" cargando={cargandoMas} disabled={cargando} onClick={cargarMas}>
                {errorMas ? 'Reintentar' : 'Cargar más'}
              </Button>
            </div>
          )}
        </div>
      )}

      <PanelFiltros abierto={panelAbierto} filtros={filtros} onAplicar={(nuevos) => { aplicar(nuevos); setPanelAbierto(false) }} onCerrar={() => setPanelAbierto(false)} />
    </div>
  )
}